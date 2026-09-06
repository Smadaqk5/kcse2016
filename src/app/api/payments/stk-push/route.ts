import dayjs from "dayjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { Prisma, SubscriptionType } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
  initiateNestlinkStkPush,
  getNestlinkConfig,
  normalizeNestlinkPhone,
} from "@/lib/nestlink";
import { getSubscriptionDurationDays } from "@/lib/access";
import { hashPassword, signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json().catch(() => ({}));
    const session = requireSession(req);
    const config = getNestlinkConfig();

    // Extract fields from either direct NestLink schema or app format
    const phone = String(rawBody.phone || rawBody.phoneNumber || "").trim();
    const rawAmount = Number(rawBody.amount || 0);

    if (!phone || isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid payload: 'phone' and a positive 'amount' are required.",
          received: { phone, amount: rawAmount },
        },
        { status: 400 }
      );
    }

    const formattedPhone = normalizeNestlinkPhone(phone);
    const reference = String(
      rawBody.reference ||
      rawBody.accountReference ||
      `KCSE-${Date.now().toString().slice(-6)}`
    );
    const description = String(
      rawBody.description ||
      rawBody.narrative ||
      "Payment for KCSE VIP Access"
    );
    const callbackUrl = String(
      rawBody.callback_url ||
      rawBody.callbackUrl ||
      `${req.nextUrl.origin}/api/payments/callback`
    );

    // Resolve user identification (session or phone guest)
    let userId = session?.userId;
    let candidateUsername = session?.username;
    let candidateUser = null;

    if (!userId) {
      let existingUser = await prisma.user.findFirst({
        where: { phone: formattedPhone },
      });

      if (!existingUser) {
        const randomSuffix = Math.random().toString(36).substring(2, 6);
        const username = `cand_${formattedPhone.slice(-6)}_${randomSuffix}`;
        const accessCode = `KCSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const randomPassword = crypto.randomBytes(16).toString("hex");
        const passwordHash = await hashPassword(randomPassword);

        existingUser = await prisma.user.create({
          data: {
            username,
            phone: formattedPhone,
            passwordHash,
            role: "SUBSCRIBER",
            isActive: true,
            twoFactorSecret: accessCode,
          },
        });
      }

      userId = existingUser.id;
      candidateUsername = existingUser.username;
      candidateUser = existingUser;
    }

    // Determine package or paper metadata if provided
    let durationDays = 1;
    let subscriptionType: SubscriptionType | null = null;
    const paperId = rawBody.paperId ? String(rawBody.paperId) : null;

    if (rawBody.type === "SUBSCRIPTION" || rawBody.subscriptionType || rawBody.packageId) {
      const typeStr = rawBody.subscriptionType as SubscriptionType | undefined;
      const pkg = rawBody.packageId
        ? await prisma.subscriptionPackage.findFirst({
            where: { id: String(rawBody.packageId), isActive: true },
          })
        : typeStr
        ? await prisma.subscriptionPackage.findFirst({
            where: { subscriptionType: typeStr, isActive: true },
          })
        : null;

      if (pkg) {
        durationDays = getSubscriptionDurationDays(pkg.subscriptionType, pkg.durationDays);
        subscriptionType = pkg.subscriptionType;
      } else if (typeStr && ["DAILY", "WEEKLY", "MONTHLY"].includes(typeStr)) {
        subscriptionType = typeStr;
        durationDays = getSubscriptionDurationDays(typeStr, 1);
      }
    }

    // Persist pending payment record in Supabase / Postgres database
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: rawAmount,
        phone: formattedPhone,
        paperId,
        subscriptionType,
        transactionRef: reference,
        metadata: {
          provider: "NESTLINK",
          account_number: config.accountNumber,
          reference,
          description,
          callback_url: callbackUrl,
          isGuestPurchase: !session,
          requestedBy: candidateUsername || formattedPhone,
          durationDays,
        },
      },
    });

    // Execute STK Push via NestLink with cryptographic HMAC-SHA256 signature
    let stkResult;
    try {
      stkResult = await initiateNestlinkStkPush({
        amount: rawAmount,
        phone: formattedPhone,
        accountReference: reference,
        description,
        callbackUrl,
        metadata: {
          paymentId: payment.id,
          userId,
          paperId,
        },
      });
    } catch (gatewayErr: unknown) {
      const errorMsg = gatewayErr instanceof Error ? gatewayErr.message : "Gateway dispatch failed";
      const existingMeta = (payment.metadata as Record<string, unknown>) || {};
      const failedMeta: Prisma.InputJsonValue = JSON.parse(
        JSON.stringify({
          ...existingMeta,
          error: errorMsg,
          failedAt: new Date().toISOString(),
        })
      );
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          metadata: failedMeta,
        },
      });

      return NextResponse.json(
        {
          error: errorMsg,
          status: "FAILED",
        },
        { status: 502 }
      );
    }

    // Update payment record with generated gateway identifiers
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        checkoutRequestId: stkResult.checkoutRequestId,
        transactionRef: stkResult.transactionId || reference,
      },
    });

    // If sandbox / instant mock simulation mode is active and simulated, auto-activate
    const isAutoSimulated =
      (process.env.NESTLINK_SIMULATE_SUCCESS === "true" || !config.hasLiveCredentials) &&
      Boolean(stkResult.isSimulated);

    if (isAutoSimulated) {
      const receiptNumber = `NL${Date.now().toString().slice(-8)}`;
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          mpesaReceiptNumber: receiptNumber,
        },
      });

      if (subscriptionType) {
        const activatedAt = new Date();
        const planDays = getSubscriptionDurationDays(subscriptionType, durationDays);
        await prisma.subscription.create({
          data: {
            userId,
            subscriptionType,
            activatedAt,
            expiresAt: dayjs(activatedAt).add(planDays, "day").toDate(),
            paymentId: payment.id,
          },
        });
      }

      if (paperId) {
        await prisma.paperPurchase.upsert({
          where: { userId_paperId: { userId, paperId } },
          update: { paymentId: payment.id },
          create: { userId, paperId, paymentId: payment.id },
        });
      }
    }

    const response = NextResponse.json({
      ok: true,
      status: isAutoSimulated ? "SUCCESS" : stkResult.status,
      checkoutRequestId: stkResult.checkoutRequestId,
      transactionId: stkResult.transactionId,
      reference,
      paymentId: payment.id,
      message: stkResult.message,
      isSimulated: stkResult.isSimulated,
      autoActivated: isAutoSimulated,
      phone: formattedPhone,
      amount: rawAmount,
      account_number: config.accountNumber,
      userId,
      username: candidateUsername,
      accessCode: candidateUser?.twoFactorSecret,
    });

    // If guest purchase, attach session cookie seamlessly
    if (!session && (candidateUser || userId)) {
      const activeUser = candidateUser || (await prisma.user.findUnique({ where: { id: userId } }));
      if (activeUser) {
        const token = signSession({
          userId: activeUser.id,
          role: "SUBSCRIBER",
          username: activeUser.username,
          phone: activeUser.phone,
        });
        response.cookies.set("kcse_session", token, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
