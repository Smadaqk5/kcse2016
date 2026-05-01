import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { createUserSchema } from "@/lib/validators";
import { hashPassword } from "@/lib/auth";

function normalizePhone(phone: string) {
  const value = phone.trim().replace(/\s+/g, "");
  if (value.startsWith("+254")) return value.slice(1);
  if (value.startsWith("0")) return `254${value.slice(1)}`;
  return value;
}

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, username: true, phone: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const user = await prisma.user.create({
    data: {
      username: parsed.data.username,
      phone: normalizePhone(parsed.data.phone),
      passwordHash: await hashPassword(parsed.data.password),
      createdByAdmin: session.userId,
    },
  });
  return NextResponse.json({ id: user.id, username: user.username });
}
