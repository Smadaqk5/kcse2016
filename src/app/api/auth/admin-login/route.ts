import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setAdminSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Mainaadam66@";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`admin-login:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many login attempts. Please wait 60 seconds." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const username = typeof body.username === "string" ? body.username.trim() : "admin";
  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  // Check master password Mainaadam66@
  const isMasterPassword = password === ADMIN_PASSWORD || password === "Mainaadam66@";

  // Check admin record in prisma
  let admin = await prisma.adminUser.findFirst({
    where: {
      username: username || "admin",
    },
  }).catch(() => null);

  if (!admin) {
    // Try finding by case-insensitive or 'admin' or email
    const allAdmins = await prisma.adminUser.findMany().catch(() => []);
    admin = allAdmins.find(
      (a) =>
        a.username.toLowerCase() === username.toLowerCase() ||
        (username.toLowerCase() === "mainaadam66@gmail.com" && a.username.toLowerCase() === "admin")
    ) || null;
  }

  // Also check User table with role ADMIN if not found in AdminUser
  let adminFromUserTable = null;
  if (!admin) {
    const candidateUser = await prisma.user.findFirst({
      where: {
        username: username || "admin",
      },
    }).catch(() => null);

    if (candidateUser && candidateUser.role === "ADMIN") {
      adminFromUserTable = candidateUser;
    }
  }

  let isValid = isMasterPassword;
  if (!isValid && admin) {
    isValid = await comparePassword(password, admin.passwordHash).catch(() => false);
  }
  if (!isValid && adminFromUserTable) {
    isValid = await comparePassword(password, adminFromUserTable.passwordHash).catch(() => false);
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
  }

  const effectiveId = admin?.id || adminFromUserTable?.id || "admin-master";
  const effectiveUsername = admin?.username || adminFromUserTable?.username || username || "admin";

  await setAdminSession({
    userId: effectiveId,
    role: "ADMIN",
    username: effectiveUsername,
  });

  return NextResponse.json({ ok: true, redirect: "/admin/dashboard" });
}
