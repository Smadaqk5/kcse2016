import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { canAccessPaper } from "@/lib/access";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = requireSession(req);
  if (!session || session.role !== "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const access = await canAccessPaper(session.userId, id);
  if (!access) return NextResponse.json({ error: "Payment required" }, { status: 402 });

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const file = await fs.readFile(paper.filePath);
  return new NextResponse(file, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=paper.pdf",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
