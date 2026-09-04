import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setUserSession } from "@/lib/auth";
import { normalizePhone, KENYA_PHONE_REGEX, KENYA_PHONE_MESSAGE } from "@/lib/phone";
import { generateAccessCode } from "@/lib/access-code";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`user-register:${ip}`, 15, 60_000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait a minute." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const rawPhone = typeof body.phone === "string" ? body.phone.trim() : "";
  const rawName = typeof body.username === "string" ? body.username.trim() : (typeof body.fullName === "string" ? body.fullName.trim() : "");

  if (!rawPhone) {
    return NextResponse.json(
      { error: "Please provide your phone number for M-Pesa access." },
      { status: 400 }
    );
  }

  let formattedPhone: string;
  try {
    formattedPhone = normalizePhone(rawPhone);
  } catch {
    return NextResponse.json({ error: KENYA_PHONE_MESSAGE }, { status: 400 });
  }

  if (!KENYA_PHONE_REGEX.test(formattedPhone)) {
    return NextResponse.json({ error: KENYA_PHONE_MESSAGE }, { status: 400 });
  }

  // Generate unique access code e.g. KCSE-7942-8316
  const accessCode = generateAccessCode();
  const username = rawName || `Candidate_${formattedPhone.slice(-4)}`;

  try {
    // Check if phone or username already registered
    const existingUser = await prisma.user.findFirst({
      where: {
        phone: formattedPhone,
      },
    });

    if (existingUser) {
      // If user already exists, retrieve or refresh access code so they can log in
      const existingCode = existingUser.twoFactorSecret || accessCode;
      if (!existingUser.twoFactorSecret) {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            twoFactorSecret: existingCode,
            passwordHash: await hashPassword(existingCode),
          },
        });
      }

      await setUserSession({
        userId: existingUser.id,
        role: "SUBSCRIBER",
        username: existingUser.username,
        phone: existingUser.phone,
      });

      return NextResponse.json({
        ok: true,
        alreadyRegistered: true,
        accessCode: existingCode,
        user: {
          id: existingUser.id,
          username: existingUser.username,
          phone: existingUser.phone,
        },
        message: "You already have an account! Here is your login Access Code.",
        redirect: "/dashboard",
      });
    }

    // Ensure unique username
    let finalUsername = username;
    const existingName = await prisma.user.findFirst({ where: { username } });
    if (existingName) {
      finalUsername = `${username}_${Math.floor(100 + Math.random() * 900)}`;
    }

    const newUser = await prisma.user.create({
      data: {
        username: finalUsername,
        phone: formattedPhone,
        passwordHash: await hashPassword(accessCode),
        role: "SUBSCRIBER",
        isActive: true,
        twoFactorSecret: accessCode, // Stores plain unique access code for easy retrieval and display
        twoFactorEnabled: false,
      },
      select: {
        id: true,
        username: true,
        phone: true,
      },
    });

    // Auto-authenticate session
    await setUserSession({
      userId: newUser.id,
      role: "SUBSCRIBER",
      username: newUser.username,
      phone: newUser.phone,
    });

    return NextResponse.json({
      ok: true,
      accessCode,
      user: newUser,
      message: "Registration successful! Make sure to copy and save your unique Access Code.",
      redirect: "/dashboard",
    });
  } catch (err) {
    console.error("[auth/register] error:", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Could not complete registration. Please try again." },
      { status: 500 }
    );
  }
}
