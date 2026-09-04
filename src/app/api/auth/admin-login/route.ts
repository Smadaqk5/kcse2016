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
  });

  if (!admin && isMasterPassword) {
    // Also check if admin exists under 'admin'
    admin = await prisma.adminUser.findFirst({
      where: { username: "admin" },
    });
  }

  let isValid = isMasterPassword;
  if (!isValid && admin) {
    isValid = await comparePassword(password, admin.passwordHash);
  }

  if (!isValid) {
    return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
  }

  await setAdminSession({
    userId: admin?.id || "admin-master",
    role: "ADMIN",
    username: admin?.username || username || "admin",
  });

  return NextResponse.json({ ok: true, redirect: "/admin/dashboard" });
}
