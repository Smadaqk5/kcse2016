import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { selfRegisterSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { Prisma } from "@prisma/client";

function normalizePhone(phone: string) {
  const value = phone.trim().replace(/\s+/g, "");
  if (value.startsWith("+254")) return value.slice(1);
  if (value.startsWith("0")) return `254${value.slice(1)}`;
  return value;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`user-register:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = selfRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username: parsed.data.username,
        phone: normalizePhone(parsed.data.phone),
        passwordHash: await hashPassword(parsed.data.password),
        role: "SUBSCRIBER",
        isActive: true,
      },
      select: { id: true, username: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[auth/register] failed", err);
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        {
          error:
            "Username or phone already exists. If you used a different phone format (07… / +254… / 254…), try logging in instead.",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Registration failed. Database error or missing tables." },
      { status: 500 },
    );
  }
}
