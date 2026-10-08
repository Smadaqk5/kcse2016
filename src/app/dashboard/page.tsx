import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/access";
import { StkForm } from "@/components/forms/stk-form";
import { CopyCodeBadge } from "@/components/copy-code-badge";
import { fetchPackagesFromFirestore } from "@/lib/firebase-db";
import {
  Clock,
  Lock,
  BookOpen,
  CheckCircle2,
  LogOut,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUBSCRIBER") redirect("/login");

  const fallbackPackages = [
    { id: "daily", name: "Daily Pass", subscriptionType: "DAILY" as const, amount: 1500, durationDays: 1 },
    { id: "weekly", name: "Weekly Booster", subscriptionType: "WEEKLY" as const, amount: 5500, durationDays: 7 },
    { id: "monthly", name: "Monthly VIP", subscriptionType: "MONTHLY" as const, amount: 12500, durationDays: 30 },
  ];

  const [subscription, purchases, papers, packages, userRecord, firestorePackages] = await Promise.all([
    hasActiveSubscription(session.userId),
    prisma.paperPurchase.findMany({ where: { userId: session.userId }, include: { paper: true } }),
    prisma.paper.findMany({ where: { isPublished: true }, take: 50 }),
    prisma.subscriptionPackage
      .findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
      .catch(() => []),
    prisma.user.findUnique({ where: { id: session.userId } }).catch(() => null),
    fetchPackagesFromFirestore().catch(() => []),
  ]);

  const rawPackages = firestorePackages.length > 0 ? firestorePackages : packages.length > 0 ? packages : fallbackPackages;
  const livePackages = rawPackages.map((p) => ({
    id: p.id,
    name: p.name,
    subscriptionType: p.subscriptionType,
    amount: Number(p.amount),
    durationDays: p.durationDays,
  }));
  const accessCode = userRecord?.twoFactorSecret || "KCSE-2026-DEMO";

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Candidate Profile Header */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-950">
              {session.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white">@{session.username}</h1>
                <CopyCodeBadge code={accessCode} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Candidate Mobile: <span className="font-mono text-emerald-400">{session.phone || "Protected"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Subscription Status</span>
              {subscription ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-1 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                  Active until {dayjs(subscription.expiresAt).format("DD MMM, HH:mm")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-1 rounded-lg">
                  <Clock className="w-4 h-4" />
                  No Active Subscription
                </span>
              )}
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>

        {/* Subscription / M-Pesa STK Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">KCSE Examination Papers</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  View-only protected documents with personalized security watermark.
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1 rounded-lg">
                {papers.length} Materials
              </span>
            </div>

            <div className="grid gap-3">
              {papers.map((paper) => {
                const bought = purchases.find((p) => p.paperId === paper.id);
                const allowed = Boolean(subscription || bought);

                return (
                  <div
                    key={paper.id}
                    className={`rounded-2xl border p-4 bg-slate-900/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      allowed
                        ? "border-slate-800 hover:border-emerald-500/50 shadow-md"
                        : "border-slate-800/80 bg-slate-950/60"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-950 text-emerald-400 border border-slate-800">
                          {paper.unitCode}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                          {paper.contentType.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-white">{paper.title}</h3>
                      {paper.description && (
                        <p className="text-xs text-slate-400 line-clamp-1">{paper.description}</p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {allowed ? (
                        <Link
                          href={`/papers/${paper.id}/view`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-bold text-white transition-colors shadow-md"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Open Viewer</span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            Locked
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <StkForm compact packages={livePackages} />
          </div>
        </div>
      </div>
    </div>
  );
}
