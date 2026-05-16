import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";
import { SubscriptionType } from "@prisma/client";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stkSchema } from "@/lib/validators";
import { initiateStkPush } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = stkSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  let paymentAmount = parsed.data.amount;
  let durationDays = 0;
  let subscriptionType = parsed.data.subscriptionType;

  if (parsed.data.type === "SUBSCRIPTION") {
    if (!parsed.data.packageId && !parsed.data.subscriptionType) {
      return NextResponse.json(
        { error: "Subscription package or type is required." },
        { status: 400 },
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
    durationDays = pkg.durationDays;
    subscriptionType = pkg.subscriptionType;
  }

  const payment = await prisma.payment.create({
    data: {
      userId: session.userId,
      amount: paymentAmount,
      phone: parsed.data.phone,
      paperId: parsed.data.paperId,
      subscriptionType,
      metadata: { type: parsed.data.type, requestedBy: session.username },
    },
  });

  const stk = await initiateStkPush({
    amount: paymentAmount,
    phone: parsed.data.phone,
  });

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      checkoutRequestId: stk.checkoutRequestId,
      transactionRef: stk.transactionId,
    },
  });

  if (process.env.MPESA_SIMULATE_SUCCESS === "true") {
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        mpesaReceiptNumber: `SIM${Date.now()}`,
      },
    });
    if (updated.subscriptionType) {
      const activatedAt = new Date();
      await prisma.subscription.create({
        data: {
          userId: updated.userId,
          subscriptionType: updated.subscriptionType,
          activatedAt,
          expiresAt: dayjs(activatedAt).add(durationDays || 1, "day").toDate(),
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

  return NextResponse.json({
    paymentId: payment.id,
    checkoutRequestId: stk.checkoutRequestId,
    transactionId: stk.transactionId,
    message: stk.message,
  });
}
