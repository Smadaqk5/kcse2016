import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/access";
import { StkForm } from "@/components/forms/stk-form";
import { CopyCodeBadge } from "@/components/copy-code-badge";
import {
  ShieldCheck,
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
    { id: "daily", name: "Daily Pass", subscriptionType: "DAILY" as const, amount: 49, durationDays: 1 },
    { id: "weekly", name: "Weekly Booster", subscriptionType: "WEEKLY" as const, amount: 199, durationDays: 7 },
    { id: "monthly", name: "Monthly VIP", subscriptionType: "MONTHLY" as const, amount: 599, durationDays: 30 },
  ];

  const [subscription, purchases, papers, packages, userRecord] = await Promise.all([
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
  ]);

  const accessCode = userRecord?.twoFactorSecret || "KCSE-2026-DEMO";

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Candidate Profile Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center shadow-sm">
              {session.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">@{session.username}</h1>
                <CopyCodeBadge code={accessCode} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Candidate Mobile: <span className="font-mono text-slate-700">{session.phone || "Protected"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Subscription Status</span>
              {subscription ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  Active until {dayjs(subscription.expiresAt).format("DD MMM, HH:mm")}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">
                  <Clock className="w-4 h-4" />
                  No Active Subscription
                </span>
              )}
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1"
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
                <h2 className="text-xl font-bold text-slate-900">KCSE Examination Papers</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  View-only protected documents with personalized security watermark.
                </p>
              </div>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
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
                    className={`rounded-xl border p-4 bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      allowed ? "border-slate-200 hover:border-emerald-300 shadow-sm" : "border-slate-200 bg-slate-50/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {paper.unitCode}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                          {paper.contentType.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900">{paper.title}</h3>
                      {paper.description && (
                        <p className="text-xs text-slate-500 line-clamp-1">{paper.description}</p>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {allowed ? (
                        <Link
                          href={`/papers/${paper.id}/view`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Open Viewer
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
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

          {/* Right sidebar: Nestlink payment & account protection */}
          <div className="space-y-6">
            <StkForm
              compact
              packages={(packages.length ? packages : fallbackPackages).map((pkg) => ({
                id: pkg.id,
                name: pkg.name,
                subscriptionType: pkg.subscriptionType,
                amount: Number(pkg.amount),
                durationDays: pkg.durationDays,
              }))}
            />

            {/* Security Guarantee */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Security & Watermark Policy</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                All examination papers are protected with live watermarks displaying your candidate username (
                <b>{session.username}</b>) and access timestamp. Screen capture and printing are actively restricted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
