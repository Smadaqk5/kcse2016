import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, setAdminSession } from "@/lib/auth";
import { loginSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`admin-login:${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const admin = await prisma.adminUser.findUnique({ where: { username: parsed.data.username } });
  if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  const isValid = await comparePassword(parsed.data.password, admin.passwordHash);
  if (!isValid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

  await setAdminSession({
    userId: admin.id,
    role: "ADMIN",
    username: admin.username,
  });
  return NextResponse.json({ ok: true });
}
