import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

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

function revalidatePublicPages() {
  try {
    revalidatePath("/", "layout");
    revalidatePath("/pricing", "page");
    revalidatePath("/papers", "page");
    revalidatePath("/dashboard", "page");
    revalidatePath("/admin/dashboard", "page");
  } catch (err) {
    console.error("[pricing] revalidate error:", err);
  }
}

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

  return NextResponse.json(
    {
      packages,
      papers,
      subscription: packages, // backwards compatibility
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}

export async function PUT(req: NextRequest) {
  const session = requireSession(req);
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  // 1. Single targeted price update
  const singleParsed = updatePricePayloadSchema.safeParse(body);
  if (singleParsed.success) {
    const { target, id, price } = singleParsed.data;
    if (target === "PACKAGE") {
      let updated = null;
      try {
        updated = await prisma.subscriptionPackage.update({
          where: { id },
          data: { amount: price },
        });
      } catch {
        // Fallback: match by subscriptionType (e.g. daily -> DAILY)
        const subType = id.toUpperCase().replace("PKG-", "").replace("PACKAGE-", "");
        const matched = await prisma.subscriptionPackage.findFirst({
          where: {
            OR: [
              { subscriptionType: subType as "DAILY" | "WEEKLY" | "MONTHLY" },
              { name: { contains: subType, mode: "insensitive" } },
            ],
          },
        });
        if (matched) {
          updated = await prisma.subscriptionPackage.update({
            where: { id: matched.id },
            data: { amount: price },
          });
        }
      }

      if (!updated) {
        return NextResponse.json({ error: `Subscription package '${id}' not found.` }, { status: 404 });
      }

      revalidatePublicPages();
      return NextResponse.json({ success: true, updated });
    } else if (target === "PAPER") {
      try {
        const updated = await prisma.paper.update({
          where: { id },
          data: { price },
        });
        revalidatePublicPages();
        return NextResponse.json({ success: true, updated });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update paper price";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  }

  // 2. Bulk price updates
  const bulkParsed = bulkPriceUpdateSchema.safeParse(body);
  if (bulkParsed.success && (bulkParsed.data.packages || bulkParsed.data.papers)) {
    const updatedPackages = [];
    const updatedPapers = [];

    if (bulkParsed.data.packages) {
      for (const item of bulkParsed.data.packages) {
        try {
          const p = await prisma.subscriptionPackage.update({
            where: { id: item.id },
            data: { amount: item.amount },
          });
          updatedPackages.push(p);
        } catch {
          // ignore individual failure
        }
      }
    }

    if (bulkParsed.data.papers) {
      for (const item of bulkParsed.data.papers) {
        try {
          const p = await prisma.paper.update({
            where: { id: item.id },
            data: { price: item.price },
          });
          updatedPapers.push(p);
        } catch {
          // ignore individual failure
        }
      }
    }

    revalidatePublicPages();
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

