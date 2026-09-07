import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deletePaperFromFirestore } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

const updatePaperSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().nullable().optional(),
  unitCode: z.string().optional(),
  topic: z.string().optional(),
  course: z.string().optional(),
  semester: z.string().optional(),
  price: z.number().min(0, "Price must be at least 0 KES").optional(),
  isPublished: z.boolean().optional(),
  contentType: z.enum(["PAST_PAPER", "REVISION_NOTE", "MOCK_EXAM"]).optional(),
});

function revalidatePublicPages() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/papers", "page");
    revalidatePath("/pricing", "page");
    revalidatePath("/admin/dashboard", "page");
  } catch (err) {
    console.error("[papers] revalidate error:", err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updatePaperSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.paper.update({
      where: { id },
      data: {
        ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
        ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
        ...(parsed.data.unitCode !== undefined ? { unitCode: parsed.data.unitCode } : {}),
        ...(parsed.data.topic !== undefined ? { topic: parsed.data.topic } : {}),
        ...(parsed.data.course !== undefined ? { course: parsed.data.course } : {}),
        ...(parsed.data.semester !== undefined ? { semester: parsed.data.semester } : {}),
        ...(parsed.data.price !== undefined ? { price: parsed.data.price } : {}),
        ...(parsed.data.isPublished !== undefined ? { isPublished: parsed.data.isPublished } : {}),
        ...(parsed.data.contentType !== undefined ? { contentType: parsed.data.contentType } : {}),
      },
    });

    revalidatePublicPages();
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update paper";
    return NextResponse.json({ error: message }, { status: 500 });
  }
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
  try {
    // 1. Attempt to locate paper to delete its file from disk
    const existing = await prisma.paper.findUnique({ where: { id } }).catch(() => null);
    if (existing?.filePath) {
      try {
        await fs.unlink(existing.filePath);
      } catch {
        // file might not exist on disk
      }
    }

    // 2. Delete paper from Firestore and register tombstone to ensure customer-facing side updates immediately
    await deletePaperFromFirestore(id);

    // 3. Delete from Prisma database if record exists (clear dependent records first)
    await prisma.paperPurchase.deleteMany({ where: { paperId: id } }).catch(() => {});
    await prisma.payment.updateMany({ where: { paperId: id }, data: { paperId: null } }).catch(() => {});
    await prisma.paper.delete({ where: { id } }).catch((err) => {
      console.warn(`[DELETE paper] Prisma delete notice for ${id}:`, err?.message || err);
    });

    // 4. Force revalidation of all public customer-facing pages
    revalidatePublicPages();

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete paper";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

