import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { z } from "zod";

const updatePricePayloadSchema = z.object({
  target: z.enum(["PACKAGE", "PAPER"]),
  id: z.string().min(1),
  price: z.number().min(0, "Price must be non-negative"),
});

const bulkPriceUpdateSchema = z.object({
  packages: z
    .array(
      z.object({
        id: z.string(),
        amount: z.number().min(10, "Minimum package price is 10 KES"),
      }),
    )
    .optional(),
  papers: z
    .array(
      z.object({
        id: z.string(),
        price: z.number().min(0, "Paper price cannot be negative"),
      }),
    )
    .optional(),
});

export async function GET(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [packages, papers] = await Promise.all([
    prisma.subscriptionPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.paper.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    packages,
    papers,
    subscription: packages, // backwards compatibility
  });
}

export async function PUT(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // 1. Single targeted price update
  const singleParsed = updatePricePayloadSchema.safeParse(body);
  if (singleParsed.success) {
    const { target, id, price } = singleParsed.data;
    if (target === "PACKAGE") {
      const updated = await prisma.subscriptionPackage.update({
        where: { id },
        data: { amount: price },
      });
      return NextResponse.json({ success: true, updated });
    } else if (target === "PAPER") {
      const updated = await prisma.paper.update({
        where: { id },
        data: { price },
      });
      return NextResponse.json({ success: true, updated });
    }
  }

  // 2. Bulk price updates
  const bulkParsed = bulkPriceUpdateSchema.safeParse(body);
  if (bulkParsed.success && (bulkParsed.data.packages || bulkParsed.data.papers)) {
    const updatedPackages = [];
    const updatedPapers = [];

    if (bulkParsed.data.packages) {
      for (const item of bulkParsed.data.packages) {
        const p = await prisma.subscriptionPackage.update({
          where: { id: item.id },
          data: { amount: item.amount },
        });
        updatedPackages.push(p);
      }
    }

    if (bulkParsed.data.papers) {
      for (const item of bulkParsed.data.papers) {
        const p = await prisma.paper.update({
          where: { id: item.id },
          data: { price: item.price },
        });
        updatedPapers.push(p);
      }
    }

    return NextResponse.json({
      success: true,
      updatedPackages,
      updatedPapers,
    });
  }

  return NextResponse.json(
    { error: "Invalid price update payload. Provide target ('PACKAGE'|'PAPER') and id with price." },
    { status: 400 },
  );
}
