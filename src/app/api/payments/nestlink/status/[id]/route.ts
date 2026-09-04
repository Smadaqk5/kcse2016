import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { signSession } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = requireSession(req);
  const { id } = await params;
  const payment = await prisma.payment.findUnique({
    where: { id },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  // Ensure only the owner or admin can inspect payment if session is present
  if (session && payment.userId !== session.userId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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

