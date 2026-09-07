import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  fetchPackagesFromFirestore,
  savePackageToFirestore,
  fetchPapersFromFirestore,
  savePaperToFirestore,
  seedFirestoreIfEmpty,
} from "@/lib/firebase-db";

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

  const [prismaPackages, prismaPapers, firestorePackages, firestorePapers] = await Promise.all([
    prisma.subscriptionPackage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.paper.findMany({
      orderBy: { createdAt: "desc" },
    }),
    fetchPackagesFromFirestore().catch(() => []),
    fetchPapersFromFirestore().catch(() => []),
  ]);

  // Merge packages: Firestore prices take priority if present
  const packageMap = new Map<string, Record<string, unknown>>();
  for (const p of prismaPackages) {
    packageMap.set(p.id, {
      ...p,
      amount: Number(p.amount),
    });
  }
  for (const fp of firestorePackages) {
    const existing = packageMap.get(fp.id);
    if (existing) {
      existing.amount = Number(fp.amount);
      if (fp.name) existing.name = fp.name;
    } else {
      packageMap.set(fp.id, {
        id: fp.id,
        name: fp.name,
        subscriptionType: fp.subscriptionType,
        amount: Number(fp.amount),
        durationDays: fp.durationDays,
        isActive: fp.isActive,
        sortOrder: fp.sortOrder,
      });
    }
  }

  const packages = Array.from(packageMap.values()).sort(
    (a, b) => Number(a.sortOrder || 1) - Number(b.sortOrder || 1)
  );

  // Merge papers
  const paperMap = new Map<string, Record<string, unknown>>();
  for (const p of prismaPapers) {
    paperMap.set(p.id, {
      ...p,
      price: Number(p.price),
    });
  }
  for (const fp of firestorePapers) {
    const existing = paperMap.get(fp.id);
    if (existing) {
      existing.price = Number(fp.price);
    } else {
      paperMap.set(fp.id, {
        id: fp.id,
        title: fp.title,
        description: fp.description,
        contentType: fp.contentType,
        unitCode: fp.unitCode,
        topic: fp.topic,
        course: fp.course,
        semester: fp.semester,
        price: Number(fp.price),
        filePath: fp.filePath,
        isPublished: fp.isPublished,
        createdAt: fp.createdAt ? new Date(fp.createdAt) : new Date(),
      });
    }
  }

  const papers = Array.from(paperMap.values()).sort(
    (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
  );

  // If Firestore was completely empty, seed it with current packages and papers
  if (firestorePackages.length === 0 && packages.length > 0) {
    seedFirestoreIfEmpty(
      packages.map((p) => ({
        id: String(p.id),
        name: String(p.name || "Access Pass"),
        subscriptionType: (p.subscriptionType as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
        amount: Number(p.amount) || 49,
        durationDays: Number(p.durationDays) || 1,
        isActive: p.isActive !== false,
        sortOrder: Number(p.sortOrder) || 1,
      })),
      papers.map((p) => ({
        id: String(p.id),
        title: String(p.title || "KCSE Paper"),
        description: p.description ? String(p.description) : null,
        contentType: String(p.contentType || "PAST_PAPER"),
        unitCode: String(p.unitCode || "GEN-01"),
        topic: String(p.topic || "General"),
        course: String(p.course || "KCSE"),
        semester: String(p.semester || "1"),
        price: Number(p.price) || 50,
        filePath: String(p.filePath || ""),
        isPublished: p.isPublished !== false,
      }))
    ).catch(() => {});
  }

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
      let rawUpdated: {
        id: string;
        name: string;
        subscriptionType: unknown;
        amount: unknown;
        durationDays: number;
        isActive: boolean;
        sortOrder: number;
      } | null = null;
      try {
        rawUpdated = await prisma.subscriptionPackage.update({
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
          rawUpdated = await prisma.subscriptionPackage.update({
            where: { id: matched.id },
            data: { amount: price },
          });
        }
      }

      if (!rawUpdated) {
        return NextResponse.json({ error: `Subscription package '${id}' not found.` }, { status: 404 });
      }

      const updated = {
        ...rawUpdated,
        subscriptionType: (String(rawUpdated.subscriptionType) as "DAILY" | "WEEKLY" | "MONTHLY") || "DAILY",
        amount: Number(rawUpdated.amount),
      };

      // Sync to Firestore immediately
      await savePackageToFirestore({
        id: updated.id,
        name: updated.name,
        subscriptionType: updated.subscriptionType,
        amount: Number(price),
        durationDays: updated.durationDays,
        isActive: updated.isActive !== false,
        sortOrder: updated.sortOrder || 1,
      }).catch((err) => {
        console.warn("[pricing] Firestore sync package error:", err);
      });

      revalidatePublicPages();
      return NextResponse.json({ success: true, updated });
    } else if (target === "PAPER") {
      try {
        const updated = await prisma.paper.update({
          where: { id },
          data: { price },
        });

        // Sync to Firestore immediately
        await savePaperToFirestore({
          id: updated.id,
          title: updated.title,
          description: updated.description,
          contentType: updated.contentType,
          unitCode: updated.unitCode,
          topic: updated.topic,
          course: updated.course,
          semester: updated.semester,
          price: Number(price),
          filePath: updated.filePath || "",
          isPublished: updated.isPublished !== false,
          createdAt: updated.createdAt instanceof Date ? updated.createdAt.toISOString() : undefined,
        }).catch((err) => {
          console.warn("[pricing] Firestore sync paper error:", err);
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

          // Sync to Firestore
          savePackageToFirestore({
            id: p.id,
            name: p.name,
            subscriptionType: p.subscriptionType,
            amount: Number(item.amount),
            durationDays: p.durationDays,
            isActive: p.isActive !== false,
            sortOrder: p.sortOrder || 1,
          }).catch(() => {});
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

          // Sync to Firestore
          savePaperToFirestore({
            id: p.id,
            title: p.title,
            description: p.description,
            contentType: p.contentType,
            unitCode: p.unitCode,
            topic: p.topic,
            course: p.course,
            semester: p.semester,
            price: Number(item.price),
            filePath: p.filePath || "",
            isPublished: p.isPublished !== false,
          }).catch(() => {});
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

