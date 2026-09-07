import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword, setUserSession, setAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { normalizeAccessCode, generateAccessCode } from "@/lib/access-code";
import { normalizePhone, KENYA_PHONE_REGEX } from "@/lib/phone";

const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Mainaadam66@";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 25, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 60 seconds." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const rawCode = typeof body.accessCode === "string" ? body.accessCode.trim() : "";
  const rawUsername = typeof body.username === "string" ? body.username.trim() : "";
  const rawPassword = typeof body.password === "string" ? body.password : "";

  // 1. Check if an Access Code or Phone was provided
  const candidateKey = rawCode || (!rawPassword && rawUsername ? rawUsername : "");

  if (candidateKey) {
    // Check if input is master admin password
    if (candidateKey === ADMIN_PASSWORD || candidateKey === "Mainaadam66@") {
      await setAdminSession({
        userId: "admin-master",
        role: "ADMIN",
        username: "admin",
      });
      return NextResponse.json({ ok: true, redirect: "/admin/dashboard", role: "ADMIN" });
    }

    const normalized = normalizeAccessCode(candidateKey);
    let user = null;

    // Check by access code in twoFactorSecret
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { twoFactorSecret: candidateKey },
          { twoFactorSecret: normalized },
        ],
      },
    });

    // Check if candidateKey looks like a phone number
    const cleaned = candidateKey.replace(/[\s\-()]/g, "");
    let normalizedPhone: string | null = null;
    try {
      const p = normalizePhone(cleaned);
      if (KENYA_PHONE_REGEX.test(p)) {
        normalizedPhone = p;
      }
    } catch {}

    if (!user && normalizedPhone) {
      // Find by normalized phone, with or without '+', or local '0' format
      const localFormat = `0${normalizedPhone.slice(3)}`;
      const plusFormat = `+${normalizedPhone}`;

      user = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: normalizedPhone },
            { phone: plusFormat },
            { phone: localFormat },
            { phone: cleaned },
          ],
        },
      });

      // If user does not exist yet and logged in using phone number:
      // Keep a record of the customer so that they can log in seamlessly!
      if (!user) {
        const newAccessCode = generateAccessCode();
        const autoUsername = `Candidate_${normalizedPhone.slice(-4)}`;
        const hashedCode = await hashPassword(newAccessCode);

        try {
          user = await prisma.user.create({
            data: {
              username: autoUsername,
              phone: normalizedPhone,
              passwordHash: hashedCode,
              role: "SUBSCRIBER",
              isActive: true,
              twoFactorSecret: newAccessCode,
              twoFactorEnabled: false,
            },
          });

          // Log customer creation
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              action: "CUSTOMER_AUTO_REGISTERED",
              details: `Customer registered on login with phone ${normalizedPhone}. Generated Access Code: ${newAccessCode}`,
            },
          }).catch(() => {});
        } catch {
          // If collision occurred, try finding again
          user = await prisma.user.findFirst({
            where: { phone: normalizedPhone },
          });
        }
      }
    }

    if (!user) {
      // Try searching by exact username
      user = await prisma.user.findFirst({
        where: { username: candidateKey },
      });
    }

    if (user) {
      if (!user.isActive) {
        return NextResponse.json({ error: "This candidate account has been suspended." }, { status: 403 });
      }

      // Ensure user has a valid access code recorded
      let accessCode = user.twoFactorSecret;
      if (!accessCode) {
        accessCode = generateAccessCode();
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorSecret: accessCode,
            updatedAt: new Date(),
          },
        }).catch(() => {});
      } else {
        // Keep updated timestamp as record of last active login
        await prisma.user.update({
          where: { id: user.id },
          data: { updatedAt: new Date() },
        }).catch(() => {});
      }

      // Record customer login in activity log
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: "CUSTOMER_LOGIN",
          details: `Candidate @${user.username} logged in successfully via ${normalizedPhone ? "Phone" : "Access Code"}.`,
        },
      }).catch(() => {});

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
        accessCode: accessCode,
      });
    }

    if (!rawPassword) {
      return NextResponse.json(
        { error: "Invalid Access Code or Phone Number. Please check your credentials or enter your phone number." },
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
      await prisma.user.update({
        where: { id: regularUser.id },
        data: { updatedAt: new Date() },
      }).catch(() => {});

      await prisma.activityLog.create({
        data: {
          userId: regularUser.id,
          action: "CUSTOMER_LOGIN",
          details: `Candidate @${regularUser.username} logged in via password credentials.`,
        },
      }).catch(() => {});

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

