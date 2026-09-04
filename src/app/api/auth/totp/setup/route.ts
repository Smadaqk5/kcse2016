import { NextRequest, NextResponse } from "next/server";
import { generateTotpSetup } from "@/lib/totp";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = (body.username as string | undefined)?.trim();

    if (!username || username.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.twoFactorEnabled) {
      return NextResponse.json({ error: "Account with this username already exists" }, { status: 409 });
    }

    const setup = await generateTotpSetup(username, "KCSE 2026 Portal");
    return NextResponse.json(setup);
  } catch (err: unknown) {
    console.error("[TOTP Setup] Error:", err);
    return NextResponse.json({ error: "Failed to generate Google Authenticator secret" }, { status: 500 });
  }
}
