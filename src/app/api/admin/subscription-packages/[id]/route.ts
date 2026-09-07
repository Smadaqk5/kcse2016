import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { subscriptionPackageSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = subscriptionPackageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { id } = await params;
  const updated = await prisma.subscriptionPackage.update({
    where: { id },
    data: {
      name: parsed.data.name,
      subscriptionType: parsed.data.subscriptionType,
      amount: parsed.data.amount,
      durationDays: parsed.data.durationDays,
      isActive: parsed.data.isActive ?? true,
      sortOrder: parsed.data.sortOrder ?? 0,
    },
  });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/pricing", "page");
    revalidatePath("/admin/dashboard", "page");
  } catch {}

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await prisma.subscriptionPackage.delete({ where: { id } });

  try {
    revalidatePath("/", "layout");
    revalidatePath("/pricing", "page");
    revalidatePath("/admin/dashboard", "page");
  } catch {}

  return NextResponse.json({ ok: true });
}

