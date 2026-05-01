import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "SUBSCRIBER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: body.action ?? "UNKNOWN",
      details: body.details ? String(body.details) : null,
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    },
  });
  return NextResponse.json({ ok: true });
}
