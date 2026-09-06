import dayjs from "dayjs";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { verifyNestlinkWebhook } from "@/lib/nestlink";
import { getSubscriptionDurationDays } from "@/lib/access";

const durationByType = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 } as const;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature =
    req.headers.get("x-signature") ||
    req.headers.get("x-nestlink-signature") ||
    req.headers.get("x-lipana-signature") ||
    "";

  // Validate HMAC signature if webhook secret or client secret is set
  if (signature && !verifyNestlinkWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Support multiple payload conventions sent by NestLink / Daraja / Webhooks
  const data = (body.data as Record<string, unknown>) || body;
  const checkoutRequestId = String(
    data.checkoutRequestId ||
    data.checkoutRequestID ||
    data.CheckoutRequestID ||
    data.checkout_id ||
    ""
  );
  const transactionId = String(
    data.transactionId ||
    data.reference ||
    data.MerchantRequestID ||
    ""
  );
  const rawStatus = String(
    data.status ||
    body.event ||
    data.ResultCode ||
    ""
  ).toUpperCase();

  // Locate the payment record by checkoutRequestId or transactionRef
  const payment = checkoutRequestId
    ? await prisma.payment.findFirst({ where: { checkoutRequestId } })
    : transactionId
    ? await prisma.payment.findFirst({ where: { transactionRef: transactionId } })
    : null;

  if (!payment) {
    return NextResponse.json({ ok: true, message: "Payment record not found or already processed" });
  }

  const isFailed =
    rawStatus.includes("FAIL") ||
    rawStatus.includes("CANCEL") ||
    rawStatus === "1" ||
    body.event === "payment.failed";

  if (isFailed) {
    const existingMeta = (payment.metadata as Record<string, unknown>) || {};
    const updatedMeta: Prisma.InputJsonValue = JSON.parse(JSON.stringify({ ...existingMeta, callback: body }));
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", metadata: updatedMeta },
    });
    return NextResponse.json({ ok: true, status: "FAILED" });
  }

  const isSuccess =
    rawStatus.includes("SUCCESS") ||
    rawStatus.includes("COMPLET") ||
    rawStatus === "0" ||
    rawStatus === "PAID" ||
    body.event === "payment.success";

  if (!isSuccess) {
    const existingMeta = (payment.metadata as Record<string, unknown>) || {};
    const updatedMeta: Prisma.InputJsonValue = JSON.parse(JSON.stringify({ ...existingMeta, callback: body }));
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING", metadata: updatedMeta },
    });
    return NextResponse.json({ ok: true, status: "PENDING" });
  }

  // Payment is confirmed SUCCESSful!
  const receipt = String(
    data.mpesaReceiptNumber ||
    data.receipt ||
    data.receiptNumber ||
    transactionId ||
    checkoutRequestId ||
    `NL${Date.now().toString().slice(-8)}`
  );

  const existingMeta = (payment.metadata as Record<string, unknown>) || {};
  const updatedMeta: Prisma.InputJsonValue = JSON.parse(JSON.stringify({ ...existingMeta, callback: body }));
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      mpesaReceiptNumber: receipt,
      transactionRef: transactionId || payment.transactionRef,
      metadata: updatedMeta,
    },
  });

  // Activate candidate's subscription if applicable
  if (updated.subscriptionType) {
    const activatedAt = new Date();
    const pkg = await prisma.subscriptionPackage.findFirst({
      where: { subscriptionType: updated.subscriptionType, isActive: true },
    });
    const days = pkg
      ? getSubscriptionDurationDays(pkg.subscriptionType, pkg.durationDays)
      : durationByType[updated.subscriptionType];

    await prisma.subscription.create({
      data: {
        userId: updated.userId,
        subscriptionType: updated.subscriptionType,
        activatedAt,
        expiresAt: dayjs(activatedAt).add(days, "day").toDate(),
        paymentId: updated.id,
      },
    });
  }

  // Unlock single paper if applicable
  if (updated.paperId) {
    await prisma.paperPurchase.upsert({
      where: { userId_paperId: { userId: updated.userId, paperId: updated.paperId } },
      update: { paymentId: updated.id },
      create: { userId: updated.userId, paperId: updated.paperId, paymentId: updated.id },
    });
  }

  return NextResponse.json({ ok: true, status: "SUCCESS", receipt });
}

