import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { subscriptionPackageSchema } from "@/lib/validators";

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const packages = await prisma.subscriptionPackage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(packages);
}

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscriptionPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    const created = await prisma.subscriptionPackage.create({
      data: {
        name: parsed.data.name,
        subscriptionType: parsed.data.subscriptionType,
        amount: parsed.data.amount,
        durationDays: parsed.data.durationDays,
        isActive: parsed.data.isActive ?? true,
        sortOrder: parsed.data.sortOrder ?? 0,
      },
    });
    return NextResponse.json(created);
  } catch {
    return NextResponse.json(
      { error: "Package type already exists. Edit existing package instead." },
      { status: 409 },
    );
  }
}
