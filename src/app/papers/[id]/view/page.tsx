import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { canAccessPaper, canAccessPaperByPhone } from "@/lib/access";
import { PaperViewer } from "@/components/viewer/paper-viewer";
import { SinglePaperCheckout } from "@/components/papers/single-paper-checkout";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PaperViewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { id } = await params;
  const { phone: queryPhone } = await searchParams;
  const session = await getCurrentSession();

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) notFound();

  let allowed = false;
  let viewerUsername = session?.username || "KCSE Candidate";
  let viewerPhone = session?.phone || queryPhone || "";

  if (session) {
    allowed = await canAccessPaper(session.userId, id);
  }

  // If not yet allowed and phone query param is present, check by phone
  if (!allowed && queryPhone) {
    const phoneCheck = await canAccessPaperByPhone(queryPhone, id);
    if (phoneCheck.allowed) {
      allowed = true;
      viewerPhone = queryPhone;
      viewerUsername = phoneCheck.user?.username || `Candidate (${queryPhone})`;
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6 text-slate-100 min-h-screen">
      <div className="flex items-center justify-between">
        <Link
          href="/papers"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to All Papers</span>
        </Link>
      </div>

      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-xs font-mono font-bold text-emerald-400">
            {paper.unitCode || "KCSE"}
          </span>
          <span className="text-xs text-slate-400">
            {paper.course || "Secondary Education"} {paper.topic ? `• ${paper.topic}` : ""}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          {paper.title}
        </h1>
      </div>

      {allowed ? (
        <PaperViewer
          paperId={paper.id}
          username={viewerUsername}
          phone={viewerPhone || "Protected"}
        />
      ) : (
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-800 text-amber-400 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Single Paper Access Required</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              This confidential revision material is protected. You can purchase access to this single paper directly without creating an account or signing up.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 text-left flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-semibold uppercase tracking-wider">Single Paper Fee</span>
              <span className="text-2xl font-black text-white">KES {String(paper.price)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-800/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No Account Needed</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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
              hasAccess={false}
            />

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
            >
              Get Unlimited VIP Access Pass
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
