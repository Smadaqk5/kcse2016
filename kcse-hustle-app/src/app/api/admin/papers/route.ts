import fs from "fs/promises";
import path from "path";
import { ContentType } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const papers = await prisma.paper.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(papers);
}

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "File is required" }, { status: 400 });

  const storagePath = path.join(process.cwd(), "storage", "papers");
  await fs.mkdir(storagePath, { recursive: true });
  const safeName = `${Date.now()}-${file.name.replaceAll(" ", "_")}`;
  const filePath = path.join(storagePath, safeName);
  await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const paper = await prisma.paper.create({
    data: {
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      contentType: (String(form.get("contentType") || "PAST_PAPER") as ContentType) ?? "PAST_PAPER",
      unitCode: String(form.get("unitCode") || "GEN101"),
      topic: String(form.get("topic") || "General"),
      course: String(form.get("course") || "KCSE"),
      semester: String(form.get("semester") || "1"),
      price: Number(form.get("price") || 100),
      filePath,
    },
  });
  return NextResponse.json(paper);
}
