import dayjs from "dayjs";
import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const durationByType = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 } as const;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-lipana-signature") ?? "";
  const webhookSecret = process.env.LIPANA_WEBHOOK_SECRET ?? "";
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Unauthorized webhook request" }, { status: 401 });
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isValidSignature =
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));

  if (!isValidSignature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const event = body?.event as string | undefined;
  const data = body?.data;
  const checkoutRequestId = data?.checkoutRequestID as string | undefined;
  if (!checkoutRequestId) return NextResponse.json({ ok: true });

  const payment = await prisma.payment.findFirst({ where: { checkoutRequestId } });
  if (!payment) return NextResponse.json({ ok: true });

  if (event === "payment.failed") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", metadata: body },
    });
    return NextResponse.json({ ok: true });
  }

  if (event !== "payment.success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PENDING", metadata: body },
    });
    return NextResponse.json({ ok: true });
  }

  const receipt = String(data?.transactionId ?? data?.checkoutRequestID ?? "");
  const updated = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: "SUCCESS",
      mpesaReceiptNumber: receipt,
      transactionRef: data?.transactionId ?? null,
      metadata: body,
    },
  });

  if (updated.subscriptionType) {
    const activatedAt = new Date();
    const pkg = await prisma.subscriptionPackage.findFirst({
      where: { subscriptionType: updated.subscriptionType, isActive: true },
    });
    const days = pkg?.durationDays ?? durationByType[updated.subscriptionType];
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

  if (updated.paperId) {
    await prisma.paperPurchase.upsert({
      where: { userId_paperId: { userId: updated.userId, paperId: updated.paperId } },
      update: { paymentId: updated.id },
      create: { userId: updated.userId, paperId: updated.paperId, paymentId: updated.id },
    });
  }

  return NextResponse.json({ ok: true });
}
