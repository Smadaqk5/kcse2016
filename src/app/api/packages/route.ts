import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const packages = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(
      packages.map((p) => ({
        id: p.id,
        name: p.name,
        subscriptionType: p.subscriptionType,
        amount: Number(p.amount),
        durationDays: p.durationDays,
      }))
    );
  } catch {
    return NextResponse.json([
      { id: "pkg-daily", name: "Daily Access Pass", subscriptionType: "DAILY", amount: 49, durationDays: 1 },
      { id: "pkg-weekly", name: "Weekly Exam Booster", subscriptionType: "WEEKLY", amount: 199, durationDays: 7 },
      { id: "pkg-monthly", name: "Monthly VIP Pass", subscriptionType: "MONTHLY", amount: 599, durationDays: 30 },
    ]);
  }
}
