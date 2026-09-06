import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";
import { queryNestlinkPaymentStatus } from "@/lib/nestlink";
import { getSubscriptionDurationDays } from "@/lib/access";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireSession(req);
  const { id } = await params;
  let payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Ensure only the owner or admin can inspect payment if session is present
  if (session && payment.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // If payment is pending and has a checkoutRequestId, query live gateway status
  if (payment.status === "PENDING" && payment.checkoutRequestId) {
    const remote = await queryNestlinkPaymentStatus(payment.checkoutRequestId, payment.transactionRef || undefined);

    if (remote.status === "SUCCESS") {
      const receipt = remote.receipt || `NL${Date.now().toString().slice(-8)}`;
      const metadata = (payment.metadata as Record<string, unknown>) || {};
      const durationDays = getSubscriptionDurationDays(payment.subscriptionType, Number(metadata.durationDays || 1));

      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          mpesaReceiptNumber: receipt,
          metadata: {
            ...metadata,
            verifiedVia: "NESTLINK_GATEWAY_QUERY",
            verifiedAt: new Date().toISOString(),
          },
        },
      });

      if (payment.subscriptionType) {
        const activatedAt = new Date();
        const planDays = getSubscriptionDurationDays(payment.subscriptionType, durationDays);
        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            subscriptionType: payment.subscriptionType,
            activatedAt,
            expiresAt: dayjs(activatedAt).add(planDays, "day").toDate(),
            paymentId: payment.id,
          },
        });
      }

      if (payment.paperId) {
        await prisma.paperPurchase.upsert({
          where: { userId_paperId: { userId: payment.userId, paperId: payment.paperId } },
          update: { paymentId: payment.id },
          create: { userId: payment.userId, paperId: payment.paperId, paymentId: payment.id },
        });
      }
    } else if (remote.status === "FAILED") {
      payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
        },
      });
    }
  }

  const response = NextResponse.json({
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    phone: payment.phone,
    receipt: payment.mpesaReceiptNumber,
    transactionRef: payment.transactionRef,
    updatedAt: payment.updatedAt,
    paperId: payment.paperId,
    subscriptionType: payment.subscriptionType,
  });

  // If payment succeeded and visitor is not logged in, auto-attach session cookie
  if (payment.status === "SUCCESS" && !session) {
    const user = await prisma.user.findUnique({ where: { id: payment.userId } });
    if (user) {
      const token = signSession({
        userId: user.id,
        role: user.role,
        username: user.username,
        phone: user.phone,
      });
      response.cookies.set("kcse_session", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
  }

  return response;
}

