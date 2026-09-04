import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setUserSession, setAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeAccessCode } from "@/lib/access-code";

const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Mainaadam66@";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 60 seconds." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const rawCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  const rawUsername = typeof body.username === "string" ? body.username.trim() : "";
  const rawPassword = typeof body.password === "string" ? body.password : "";

  // 1. Check if an Access Code was provided
  const candidateKey = rawCode || (!rawPassword && rawUsername ? rawUsername : "");

  if (candidateKey) {
    const normalized = normalizeAccessCode(candidateKey);
    // Find candidate by access code (stored in twoFactorSecret)
    let user = await prisma.user.findFirst({
      where: {
        twoFactorSecret: candidateKey,
      },
    });

    if (!user) {
      // Try finding by normalized code or username or phone
      user = await prisma.user.findFirst({
        where: {
          twoFactorSecret: normalized,
        },
      });
    }

    if (!user) {
      // Try searching by phone or username
      user = await prisma.user.findFirst({
        where: {
          phone: candidateKey,
        },
      });
    }

    if (!user) {
      // Try comparing passwordHash with candidateKey
      const allUsers = await prisma.user.findMany();
      for (const u of allUsers) {
        if (u.twoFactorSecret && normalizeAccessCode(u.twoFactorSecret) === normalized) {
          user = u;
          break;
        }
        const matches = await comparePassword(candidateKey, u.passwordHash).catch(() => false);
        if (matches) {
          user = u;
          break;
        }
      }
    }

    if (user) {
      if (!user.isActive) {
        return NextResponse.json({ error: "This candidate account has been suspended." }, { status: 403 });
      }

      await setUserSession({
        userId: user.id,
        role: "SUBSCRIBER",
        username: user.username,
        phone: user.phone,
      });

      return NextResponse.json({
        ok: true,
        redirect: "/dashboard",
        role: "SUBSCRIBER",
        username: user.username,
      });
    }

    // If candidate key didn't match candidate, but matches admin password Mainaadam66@
    if (candidateKey === ADMIN_PASSWORD || candidateKey === "Mainaadam66@") {
      await setAdminSession({
        userId: "admin-master",
        role: "ADMIN",
        username: "admin",
      });
      return NextResponse.json({ ok: true, redirect: "/admin/dashboard", role: "ADMIN" });
    }

    if (!rawPassword) {
      return NextResponse.json(
        { error: "Invalid Access Code. Please check the code you saved during registration and try again." },
        { status: 401 }
      );
    }
  }

  // 2. Check Admin Credentials (Username + Password)
  const isMasterAdminPassword = rawPassword === ADMIN_PASSWORD || rawPassword === "Mainaadam66@";
  const isAdminUsername =
    rawUsername.toLowerCase() === "admin" ||
    rawUsername.toLowerCase() === "mainaadam66@gmail.com" ||
    rawUsername.toLowerCase() === "mainaadam66";

  if (isMasterAdminPassword && (isAdminUsername || !rawUsername)) {
    await setAdminSession({
      userId: "admin-master",
      role: "ADMIN",
      username: rawUsername || "admin",
    });
    return NextResponse.json({ ok: true, redirect: "/admin/dashboard", role: "ADMIN" });
  }

  const admin = await prisma.adminUser.findFirst({
    where: { username: rawUsername },
  });

  if (admin) {
    const adminOk = isMasterAdminPassword || (await comparePassword(rawPassword, admin.passwordHash));
    if (adminOk) {
      await setAdminSession({
        userId: admin.id,
        role: "ADMIN",
        username: admin.username,
      });
      return NextResponse.json({ ok: true, redirect: "/admin/dashboard", role: "ADMIN" });
    }
  }

  // 3. Fallback check for regular subscriber with username/password
  const regularUser = await prisma.user.findFirst({
    where: { username: rawUsername },
  });

  if (regularUser) {
    const isValidPass =
      (regularUser.twoFactorSecret && regularUser.twoFactorSecret === rawPassword) ||
      (await comparePassword(rawPassword, regularUser.passwordHash));

    if (isValidPass) {
      await setUserSession({
        userId: regularUser.id,
        role: "SUBSCRIBER",
        username: regularUser.username,
        phone: regularUser.phone,
      });
      return NextResponse.json({ ok: true, redirect: "/dashboard", role: "SUBSCRIBER" });
    }
  }

  return NextResponse.json(
    { error: "Invalid login credentials. Please check your unique access code or password." },
    { status: 401 }
  );
}
