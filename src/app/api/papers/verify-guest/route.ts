import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canAccessPaper } from "@/lib/access";
import { signSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const rawPhone = String(body.phone || "").trim().replace(/[\s-]/g, "");
  const paperId = body.paperId as string | undefined;

  if (!rawPhone) {
    return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
  }

  // Find user by phone
  let user = await prisma.user.findFirst({
    where: { phone: rawPhone },
  });

  if (!user && !rawPhone.startsWith("254") && rawPhone.startsWith("0")) {
    const formatted = "254" + rawPhone.slice(1);
    user = await prisma.user.findFirst({ where: { phone: formatted } });
  }

  if (!user) {
    // Check if there are any successful payments matching this phone
    const payment = await prisma.payment.findFirst({
      where: {
        phone: rawPhone,
        status: "SUCCESS",
        ...(paperId ? { paperId } : {}),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!payment) {
      return NextResponse.json({
        unlocked: false,
        error: "No active purchase or subscription found for this phone number.",
      }, { status: 404 });
    }

    user = await prisma.user.findUnique({ where: { id: payment.userId } });
  }

  if (!user) {
    return NextResponse.json({
      unlocked: false,
      error: "User record not found for this purchase.",
    }, { status: 404 });
  }

  // If paperId is specified, check access for that paper
  let hasAccess = true;
  if (paperId) {
    hasAccess = await canAccessPaper(user.id, paperId);
  }

  if (!hasAccess) {
    return NextResponse.json({
      unlocked: false,
      error: "This phone number has not purchased this paper or subscription has expired.",
    }, { status: 403 });
  }

  // Set session cookie
  const token = signSession({
    userId: user.id,
    role: user.role,
    username: user.username,
    phone: user.phone,
  });

  const response = NextResponse.json({
    ok: true,
    unlocked: true,
    username: user.username,
    phone: user.phone,
    accessCode: user.twoFactorSecret,
    message: "Access granted! Enjoy your KCSE revision materials.",
  });

  response.cookies.set("kcse_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return response;
}
