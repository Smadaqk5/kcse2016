import dayjs from "dayjs";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { SubscriptionType } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stkSchema } from "@/lib/validators";
import { initiateNestlinkStkPush } from "@/lib/nestlink";
import { getSubscriptionDurationDays } from "@/lib/access";
import { hashPassword, signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  const body = await req.json().catch(() => ({}));
  const parsed = stkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payment payload. Please check your phone number and amount." },
      { status: 400 }
    );
  }

  // Support guest purchases: If no active session, find or auto-create candidate user by phone
  let userId = session?.userId;
  let candidateUsername = session?.username;
  let candidateUser = null;

  if (!userId) {
    const cleanPhone = parsed.data.phone;
    let existingUser = await prisma.user.findFirst({
      where: { phone: cleanPhone },
    });

    if (!existingUser) {
      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const username = `cand_${cleanPhone.slice(-6)}_${randomSuffix}`;
      const accessCode = `KCSE-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomPassword);

      existingUser = await prisma.user.create({
        data: {
          username,
          phone: cleanPhone,
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

  let paymentAmount = parsed.data.amount;
  let durationDays = 1;
  let subscriptionType = parsed.data.subscriptionType;

  if (parsed.data.type === "SUBSCRIPTION") {
    if (!parsed.data.packageId && !parsed.data.subscriptionType) {
      return NextResponse.json(
        { error: "Subscription package or type is required." },
        { status: 400 }
      );
    }

    const pkg = parsed.data.packageId
      ? await prisma.subscriptionPackage.findFirst({
          where: { id: parsed.data.packageId, isActive: true },
        })
      : await prisma.subscriptionPackage.findFirst({
          where: {
            subscriptionType: parsed.data.subscriptionType as SubscriptionType,
            isActive: true,
          },
        });

    if (!pkg) {
      return NextResponse.json({ error: "Subscription package not found." }, { status: 404 });
    }
    paymentAmount = Number(pkg.amount);
    durationDays = getSubscriptionDurationDays(pkg.subscriptionType, pkg.durationDays);
    subscriptionType = pkg.subscriptionType;
  } else if (parsed.data.type === "PAPER" && parsed.data.paperId) {
    const paper = await prisma.paper.findUnique({
      where: { id: parsed.data.paperId },
    });
    if (paper) {
      paymentAmount = Number(paper.price);
    }
  }

  // Create payment record
  const payment = await prisma.payment.create({
    data: {
      userId,
      amount: paymentAmount,
      phone: parsed.data.phone,
      paperId: parsed.data.paperId,
      subscriptionType,
      metadata: {
        provider: "NESTLINK",
        type: parsed.data.type,
        requestedBy: candidateUsername || parsed.data.phone,
        durationDays,
        isGuestPurchase: !session,
      },
    },
  });

  // Call Nestlink STK push
  let stk;
  try {
    stk = await initiateNestlinkStkPush({
      amount: paymentAmount,
      phone: parsed.data.phone,
      accountReference: `KCSE-${(candidateUsername || parsed.data.phone).slice(-8).toUpperCase()}`,
      description: parsed.data.type === "SUBSCRIPTION" ? `KCSE ${subscriptionType} Access` : "KCSE Paper Purchase",
      metadata: {
        paymentId: payment.id,
        userId,
        paperId: parsed.data.paperId,
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Live payment dispatch failed.";
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
        metadata: {
          ...((payment.metadata as Record<string, unknown>) || {}),
          error: errorMsg,
          failedAt: new Date().toISOString(),
        },
      },
    });

    return NextResponse.json(
      { error: errorMsg },
      { status: 502 }
    );
  }

  // Update payment with Nestlink identifiers
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutRequestId: stk.checkoutRequestId,
      transactionRef: stk.transactionId,
    },
  });

  // Auto-activate in simulation mode if configured
  const autoSimulate = process.env.NESTLINK_SIMULATE_SUCCESS === "true" || process.env.MPESA_SIMULATE_SUCCESS === "true";
  if (autoSimulate && stk.isSimulated) {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        mpesaReceiptNumber: `NL${Date.now().toString().slice(-8)}`,
      },
    });

    if (updated.subscriptionType) {
      const activatedAt = new Date();
      const planDays = getSubscriptionDurationDays(updated.subscriptionType, durationDays);
      await prisma.subscription.create({
        data: {
          userId: updated.userId,
          subscriptionType: updated.subscriptionType,
          activatedAt,
          expiresAt: dayjs(activatedAt).add(planDays, "day").toDate(),
          paymentId: updated.id,
        },
      });
    }

    if (updated.paperId) {
      await prisma.paperPurchase.upsert({
        where: { userId_paperId: { userId: updated.userId, paperId: updated.paperId } },
        update: { paymentId: updated.id },
        create: { userId: updated.userId, paperId: updated.paperId, paymentId: updated.id },
      });
    }
  }

  const response = NextResponse.json({
    ok: true,
    paymentId: payment.id,
    checkoutRequestId: stk.checkoutRequestId,
    transactionId: stk.transactionId,
    message: stk.message,
    isSimulated: stk.isSimulated,
    autoActivated: autoSimulate && stk.isSimulated,
    paperId: parsed.data.paperId,
    phone: parsed.data.phone,
    userId,
    username: candidateUsername,
    accessCode: candidateUser?.twoFactorSecret,
  });

  // If candidate was not logged in, seamlessly attach authentication cookie
  if (!session) {
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
}
