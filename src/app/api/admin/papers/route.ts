import fs from "fs/promises";
import path from "path";
import { ContentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
import { fetchPapersFromFirestore, savePaperToFirestore } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch from both prisma and Firestore
  const [prismaPapers, firestorePapers] = await Promise.all([
    prisma.paper.findMany({ orderBy: { createdAt: "desc" } }),
    fetchPapersFromFirestore().catch(() => []),
  ]);

  // Merge so Firestore items take precedence or combine
  const map = new Map<string, Record<string, unknown>>();
  for (const p of prismaPapers) {
    map.set(p.id, p as unknown as Record<string, unknown>);
  }
  for (const fp of firestorePapers) {
    map.set(fp.id, {
      ...map.get(fp.id),
      ...fp,
      createdAt: fp.createdAt ? new Date(fp.createdAt) : new Date(),
      updatedAt: fp.updatedAt ? new Date(fp.updatedAt) : new Date(),
    });
  }

  const papers = Array.from(map.values()).sort(
    (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
  );

  return NextResponse.json(papers, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized admin session. Please log in again." }, { status: 401 });
  }

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = String(form.get("title") || "").trim();
    const unitCode = String(form.get("unitCode") || "GEN101").trim();
    const topic = String(form.get("topic") || "General").trim();
    const course = String(form.get("course") || "KCSE").trim();
    const semester = String(form.get("semester") || "1").trim();
    const price = Number(form.get("price") || 50);
    const description = String(form.get("description") || "");
    const contentTypeRaw = String(form.get("contentType") || "PAST_PAPER");
    const contentType = (contentTypeRaw as ContentType) ?? "PAST_PAPER";

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const storagePath = path.join(process.cwd(), "storage", "papers");
    await fs.mkdir(storagePath, { recursive: true });

    let filePath = path.join(storagePath, `auto-${Date.now()}.pdf`);

    if (file && typeof file.arrayBuffer === "function" && file.size > 0) {
      const rawName = file.name || `paper-${Date.now()}.pdf`;
      const safeName = `${Date.now()}-${rawName.replace(/\s+/g, "_")}`;
      filePath = path.join(storagePath, safeName);
      await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
    } else {
      // Create empty placeholder if not exists so preview generator works smoothly
      try {
        await fs.writeFile(filePath, Buffer.from("%PDF-1.4\n%KCSE Examination Resource\n"));
      } catch {}
    }

    const paper = await prisma.paper.create({
      data: {
        title,
        description,
        contentType,
        unitCode,
        topic,
        course,
        semester,
        price,
        filePath,
        isPublished: true,
      },
    });

    // Mirror immediately to user's Firestore database
    await savePaperToFirestore({
      id: paper.id,
      title: paper.title,
      description: paper.description,
      contentType: paper.contentType,
      unitCode: paper.unitCode,
      topic: paper.topic,
      course: paper.course,
      semester: paper.semester,
      price: Number(paper.price),
      filePath: paper.filePath,
      isPublished: paper.isPublished,
      createdAt: paper.createdAt instanceof Date ? paper.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).catch((err) => {
      console.warn("[papers] Firestore sync notice:", err);
    });

    try {
      revalidatePath("/", "layout");
      revalidatePath("/papers", "page");
      revalidatePath("/pricing", "page");
      revalidatePath("/admin/dashboard", "page");
    } catch (err) {
      console.error("[papers] revalidate error:", err);
    }

    return NextResponse.json(paper);
  } catch (error: unknown) {
    console.error("[papers] Error uploading paper:", error);
    const message = error instanceof Error ? error.message : "Failed to process paper upload";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

