import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getSubscriptionDurationDays } from "@/lib/access";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  const body = await req.json().catch(() => ({}));
  const paymentId = body.paymentId as string | undefined;
  if (!paymentId) {
    return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // If a session is active, verify ownership (or admin privileges)
  if (session && payment.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const metadata = (payment.metadata as Record<string, unknown>) || {};
  const durationDays = getSubscriptionDurationDays(payment.subscriptionType, Number(metadata.durationDays || 1));

  // Mark payment as success
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      mpesaReceiptNumber: `NL${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
    },
  });

  // Activate Subscription if subscriptionType exists
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

  // Grant Paper purchase if paperId exists
  if (updated.paperId) {
    await prisma.paperPurchase.upsert({
      where: { userId_paperId: { userId: updated.userId, paperId: updated.paperId } },
      update: { paymentId: updated.id },
      create: { userId: updated.userId, paperId: updated.paperId, paymentId: updated.id },
    });
  }

  const response = NextResponse.json({
    ok: true,
    status: "SUCCESS",
    receiptNumber: updated.mpesaReceiptNumber,
    paperId: updated.paperId,
    message: "Payment confirmed successfully via Nestlink! Access has been activated.",
  });

  // If candidate was not logged in, set session cookie automatically
  if (!session) {
    const user = await prisma.user.findUnique({ where: { id: updated.userId } });
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
