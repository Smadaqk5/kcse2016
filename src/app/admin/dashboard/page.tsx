import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { AdminTools } from "@/components/forms/admin-tools";
import { SupabaseStatusCard } from "@/components/admin/supabase-status-card";
import { PricingManager } from "@/components/admin/pricing-manager";
import { ShieldCheck, Zap, Users, TrendingUp, BookOpen, Clock, CheckCircle2, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");

  const [revenue, subscribers, popularPapers, payments, users] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.subscription.count({ where: { isActive: true } }),
    prisma.paper.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { purchases: { _count: "desc" } },
      take: 5,
    }),
    prisma.payment.findMany({
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                Portal Administration
              </span>
              <span className="text-xs font-medium text-slate-400">M-Pesa &amp; Access Code Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Signed in as <b className="text-emerald-400">@{session.username}</b>
            </span>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">
              KES {Number(revenue._sum.amount ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400 font-semibold">Via Lipa na M-Pesa STK Push</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Subscribers</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{subscribers}</p>
            <p className="text-[11px] text-slate-400">Unexpired reading passes</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Registered Candidates</span>
              <KeyRound className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{users.length}</p>
            <p className="text-[11px] text-emerald-400 font-semibold">Unique Access Codes Generated</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-md space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Active Papers</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">{popularPapers.length}</p>
            <p className="text-[11px] text-slate-400">Watermarked &amp; Protected</p>
          </div>
        </div>

        {/* Supabase Database Connection & Schema Status */}
        <SupabaseStatusCard />

        {/* Dynamic Price & Tariff Management */}
        <PricingManager />

        {/* Admin Tools for Creating Papers / Managing Packages */}
        <AdminTools />

        {/* Registered Candidates & Access Codes Lookup Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-base text-white">Registered Candidates &amp; Access Codes</h2>
            </div>
            <span className="text-xs text-slate-400">{users.length} Candidates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Registered</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Unique Access Code</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u) => {
                  const accessCode = u.twoFactorSecret || "KCSE-2026-DEMO";
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-400">{dayjs(u.createdAt).format("DD MMM, HH:mm")}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">@{u.username}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{u.phone}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold bg-slate-950 text-emerald-400 px-2.5 py-1 rounded-lg border border-slate-800 select-all">
                          {accessCode}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            u.isActive ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {u.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Table */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-base text-white">Recent M-Pesa STK Transactions</h2>
            </div>
            <span className="text-xs text-slate-400">{payments.length} Transactions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Candidate</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Receipt / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {payments.map((p) => {
                  const isSuccess = p.status === "SUCCESS";
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50">
                      <td className="py-2.5 px-3 text-slate-400">{dayjs(p.createdAt).format("DD MMM, HH:mm")}</td>
                      <td className="py-2.5 px-3 font-semibold text-white">@{p.user?.username || "Guest"}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{p.phone}</td>
                      <td className="py-2.5 px-3 text-slate-300">{p.subscriptionType || "SINGLE"}</td>
                      <td className="py-2.5 px-3 font-bold text-white">KES {Number(p.amount)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            isSuccess
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : p.status === "PENDING"
                              ? "bg-amber-950 text-amber-400 border border-amber-800"
                              : "bg-rose-950 text-rose-400 border border-rose-800"
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {p.mpesaReceiptNumber || p.checkoutRequestId?.slice(0, 12) || "Pending"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
