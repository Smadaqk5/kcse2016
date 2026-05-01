import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payments = await prisma.payment.findMany({
    include: { user: { select: { username: true, phone: true } }, paper: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(payments);
}
