import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setUserSession, setAdminSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const { username, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (admin) {
    const adminOk = await comparePassword(password, admin.passwordHash);
    if (!adminOk) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    await setAdminSession({
      userId: admin.id,
      role: "ADMIN",
      username: admin.username,
    });
    return NextResponse.json({ ok: true, redirect: "/admin/dashboard" });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.role !== "SUBSCRIBER") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await setUserSession({
    userId: user.id,
    role: "SUBSCRIBER",
    username: user.username,
    phone: user.phone,
  });
  return NextResponse.json({ ok: true, redirect: "/dashboard" });
}
