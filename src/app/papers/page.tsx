import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { canAccessPaper } from "@/lib/access";
import { SinglePaperCheckout } from "@/components/papers/single-paper-checkout";
import { ShieldCheck, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
  const session = await getCurrentSession();
  let papers: Awaited<ReturnType<typeof prisma.paper.findMany>> = [];
  let dbOffline = false;

  try {
    papers = await prisma.paper.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header and Guest Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Examination Papers & Revision Series
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Access authentic KCSE past examinations, confidential marking schemes, and predicted trial papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 text-xs sm:text-sm font-semibold transition"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>View All Access Passes</span>
          </Link>
        </div>
      </div>

      {/* Guest Checkout Notice */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-emerald-950 shadow-sm">
        <div className="flex items-start sm:items-center gap-3">
          <div className="rounded-xl bg-emerald-600 text-white p-2.5 shadow-sm shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-emerald-900">
              Direct Guest Checkout Available
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 mt-0.5">
              No account or registration required. You can purchase single papers on the spot using Safaricom M-Pesa.
            </p>
          </div>
        </div>

        <div className="shrink-0 text-xs font-semibold bg-white/80 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
          Instant M-Pesa Push
        </div>
      </div>

      {dbOffline && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-sm">
          Database is temporarily unreachable. Past papers will be loaded once the connection recovers.
        </div>
      )}

      {/* Papers Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {papers.map((paper) => {
          const hasAccess = Boolean(accessMap[paper.id]);
          return (
            <article
              key={paper.id}
              className="group flex flex-col justify-between rounded-2xl bg-white border border-slate-200/90 hover:border-emerald-300 p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                    {paper.unitCode || "KCSE"}
                  </span>
                  {hasAccess && (
                    <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                      Unlocked
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {paper.title}
                </h3>

                <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                  {paper.topic || "General Examination"} {paper.course ? `• ${paper.course}` : ""}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Price
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900">
                    KES {String(paper.price)}
                  </span>
                </div>

                <SinglePaperCheckout
                  paper={{
                    id: paper.id,
                    title: paper.title,
                    unitCode: paper.unitCode,
                    topic: paper.topic,
                    course: paper.course,
                    semester: paper.semester,
                    price: Number(paper.price),
                  }}
                  hasAccess={hasAccess}
                />
              </div>
            </article>
          );
        })}

        {!dbOffline && papers.length === 0 && (
          <div className="col-span-full rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">No examination papers available yet.</p>
            <p className="text-xs text-slate-500 mt-1">Please check back shortly as the controller uploads revision papers.</p>
          </div>
        )}
      </div>
    </section>
  );
}
