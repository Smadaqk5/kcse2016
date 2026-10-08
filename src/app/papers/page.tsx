import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { canAccessPaper } from "@/lib/access";
import { PapersCatalog, CatalogPaper } from "@/components/papers/papers-catalog";
import { ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";
import { fetchPapersFromFirestore, fetchDeletedPaperIds } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

interface DisplayPaper {
  id: string;
  title: string;
  description?: string | null;
  contentType: string;
  unitCode: string;
  topic: string;
  course: string;
  semester: string;
  price: number;
  filePath: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export default async function PapersPage() {
  const session = await getCurrentSession();
  let papers: DisplayPaper[] = [];
  let dbOffline = false;

  try {
    const [prismaPapers, firestorePapers, deletedSet] = await Promise.all([
      prisma.paper
        .findMany({
          where: { isPublished: true },
          orderBy: { createdAt: "desc" },
          take: 100,
        })
        .catch(() => []),
      fetchPapersFromFirestore().catch(() => []),
      fetchDeletedPaperIds().catch(() => new Set<string>()),
    ]);

    const map = new Map<string, DisplayPaper>();
    for (const p of prismaPapers) {
      if (deletedSet.has(p.id)) continue;
      map.set(p.id, {
        ...p,
        price: Number(p.price),
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      });
    }
    for (const fp of firestorePapers) {
      if (deletedSet.has(fp.id)) continue;
      if (fp.isPublished !== false) {
        map.set(fp.id, {
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
          updatedAt: fp.updatedAt ? new Date(fp.updatedAt) : new Date(),
        });
      }
    }

    // Explicitly prune any deleted papers
    for (const delId of deletedSet) {
      map.delete(delId);
    }

    papers = Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    dbOffline = true;
  }

  // Preload access statuses if session is available
  const accessMap: Record<string, boolean> = {};
  if (session && papers.length > 0) {
    await Promise.all(
      papers.map(async (p) => {
        try {
          const allowed = await canAccessPaper(session.userId, p.id);
          accessMap[p.id] = allowed;
        } catch {
          accessMap[p.id] = false;
        }
      })
    );
  }

  // Serialize papers for client component
  const serializedPapers: CatalogPaper[] = papers.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    contentType: p.contentType,
    unitCode: p.unitCode,
    topic: p.topic,
    course: p.course,
    semester: p.semester,
    price: Number(p.price),
    filePath: p.filePath,
    isPublished: p.isPublished,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
  }));

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6 text-slate-100">
      {/* Header and Guest Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Examination Papers &amp; Revision Series
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Access authentic KCSE past examinations, confidential marking schemes, and predicted trial papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2.5 text-xs sm:text-sm font-semibold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>View All Access Passes</span>
          </Link>
        </div>
      </div>

      {/* Guest Checkout Notice */}
      <div className="rounded-2xl border border-emerald-900/60 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-200 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="rounded-xl bg-emerald-600 text-white p-2.5 shadow-md shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white">
              Direct Guest Checkout Available
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              No account or registration required. You can purchase single papers on the spot using Safaricom M-Pesa.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-3 py-1.5 rounded-xl">
          Instant M-Pesa Push
        </div>
      </div>

      {/* Search Bar, Subject Filter, and Papers Catalog Grid */}
      <PapersCatalog
        papers={serializedPapers}
        accessMap={accessMap}
        dbOffline={dbOffline}
      />
    </section>
  );
}
