import dayjs from "dayjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyNestlinkWebhook } from "@/lib/nestlink";

const durationByType = { DAILY: 1, WEEKLY: 7, MONTHLY: 30 } as const;

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-nestlink-signature") || req.headers.get("x-signature") || "";

  if (!verifyNestlinkWebhook(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid Nestlink signature" }, { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Support both Nestlink events and native Safaricom Daraja stkCallback structures
    const stkCallback = body?.Body?.stkCallback;
    const isDaraja = Boolean(stkCallback);

    let checkoutRequestId: string | undefined;
    let transactionId: string | undefined;
    let isFailed = false;
    let receiptNumber: string | undefined;

    if (isDaraja) {
      checkoutRequestId = stkCallback.CheckoutRequestID || stkCallback.MerchantRequestID;
      if (stkCallback.ResultCode !== 0) {
        isFailed = true;
      } else {
        const items = (stkCallback.CallbackMetadata?.Item as Array<{ Name: string; Value: unknown }>) || [];
        const receiptItem = items.find((it) => it.Name === "MpesaReceiptNumber");
        receiptNumber = receiptItem ? String(receiptItem.Value) : undefined;
        transactionId = receiptNumber || checkoutRequestId;
      }
    } else {
      const event = body?.event as string | undefined;
      const data = body?.data ?? body;
      checkoutRequestId = (data?.checkoutRequestId || data?.CheckoutRequestID || data?.checkout_id || data?.reference) as string | undefined;
      transactionId = (data?.transactionId || data?.receiptNumber || data?.id) as string | undefined;
      receiptNumber = (data?.mpesaReceiptNumber || data?.receiptNumber || transactionId) as string | undefined;

      if (event === "payment.failed" || data?.status === "FAILED" || data?.status === "CANCELLED") {
        isFailed = true;
      }
    }

    if (!checkoutRequestId && !transactionId) {
      return NextResponse.json({ ok: true, message: "No identifier found" });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          checkoutRequestId ? { checkoutRequestId } : {},
          transactionId ? { transactionRef: transactionId } : {},
        ],
      },
    });

    if (!payment) {
      return NextResponse.json({ ok: true, message: "Payment not found" });
    }

    if (isFailed) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", metadata: body },
      });
      return NextResponse.json({ ok: true });
    }

    // Success event
    const receipt = receiptNumber || String(transactionId || `NL${Date.now()}`);
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        mpesaReceiptNumber: receipt,
        transactionRef: transactionId || payment.transactionRef,
        metadata: body,
      },
    });

    if (updated.subscriptionType) {
      const durationDays = durationByType[updated.subscriptionType] ?? 1;
      const activatedAt = new Date();
      await prisma.subscription.create({
        data: {
          userId: updated.userId,
          subscriptionType: updated.subscriptionType,
          activatedAt,
          expiresAt: dayjs(activatedAt).add(durationDays, "day").toDate(),
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
  } catch (err) {
    console.error("[Nestlink Webhook] Parsing error:", err);
    return NextResponse.json({ error: "Webhook processing error" }, { status: 400 });
  }
}
