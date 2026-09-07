import fs from "fs/promises";
import path from "path";
import { ContentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const papers = await prisma.paper.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(papers, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  let filePath = path.join(process.cwd(), "storage", "papers", `auto-${Date.now()}.pdf`);

  if (file && typeof file.arrayBuffer === "function") {
    const storagePath = path.join(process.cwd(), "storage", "papers");
    await fs.mkdir(storagePath, { recursive: true });
    const safeName = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
    filePath = path.join(storagePath, safeName);
    await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));
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

  try {
    revalidatePath("/", "layout");
    revalidatePath("/papers", "page");
    revalidatePath("/pricing", "page");
    revalidatePath("/admin/dashboard", "page");
  } catch (err) {
    console.error("[papers] revalidate error:", err);
  }

  return NextResponse.json(paper);
}

