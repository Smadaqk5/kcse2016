import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { StkForm } from "@/components/forms/stk-form";
import { prisma } from "@/lib/prisma";
import { Zap, CheckCircle2, Lock, KeyRound } from "lucide-react";
import { fetchPackagesFromFirestore } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getCurrentSession();
  const fallbackPlans = [
    { id: "daily", name: "Daily Access Pass", subscriptionType: "DAILY" as const, amount: 1500, durationDays: 1 },
    { id: "weekly", name: "Weekly Exam Booster", subscriptionType: "WEEKLY" as const, amount: 5500, durationDays: 7 },
    { id: "monthly", name: "Monthly VIP Pass", subscriptionType: "MONTHLY" as const, amount: 12500, durationDays: 30 },
  ];
  let plans = fallbackPlans;

  try {
    const firestorePlans = await fetchPackagesFromFirestore().catch(() => []);
    if (firestorePlans.length > 0) {
      plans = firestorePlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        subscriptionType: plan.subscriptionType,
        amount: Number(plan.amount),
        durationDays: plan.durationDays,
      }));
    } else {
      const dbPlans = await prisma.subscriptionPackage.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      });
      if (dbPlans.length > 0) {
        plans = dbPlans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          subscriptionType: plan.subscriptionType,
          amount: Number(plan.amount),
          durationDays: plan.durationDays,
        }));
      }
    }
  } catch {
    // Falls back to defaults
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-3.5 py-1 text-xs font-semibold text-emerald-300 border border-emerald-800/60">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            Instant M-Pesa Express Activation
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            KCSE Subscription Access Plans
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Gain immediate, unrestricted, view-only access to all verified KCSE examination papers, marking schemes, and predicted national mocks.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isWeekly = plan.subscriptionType === "WEEKLY";
            return (
              <div
                key={plan.name}
                className={`rounded-2xl bg-slate-900/90 p-6 border transition-all relative flex flex-col justify-between ${
                  isWeekly
                    ? "border-emerald-500 shadow-xl shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                    : "border-slate-800 shadow-md hover:border-slate-700"
                }`}
              >
                {isWeekly && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-white">{plan.name}</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      {plan.durationDays === 1
                        ? "Ideal for quick evening study"
                        : plan.durationDays === 7
                        ? "Best value for mock exam season"
                        : "Complete syllabus mastery pass"}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      KES {plan.amount}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      / {plan.durationDays} {plan.durationDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Full access to all 8+ subject papers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Official KNEC point-by-point marking schemes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Anti-leak personalized digital viewer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Instant Lipa na M-Pesa STK push checkout</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  {session ? (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-emerald-400">
                        Select this plan in the M-Pesa box below ↓
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                        isWeekly
                          ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-md"
                          : "bg-slate-800 border border-slate-700 text-white hover:bg-slate-700"
                      }`}
                    >
                      Sign In with Access Code to Pay
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Checkout Section */}
        <div className="max-w-2xl mx-auto">
          {session?.role === "SUBSCRIBER" ? (
            <StkForm compact packages={plans} />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 text-center space-y-4 shadow-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Login Required for VIP Subscriptions</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                  To subscribe to an unlimited pass, sign in with your candidate access code or register in 10 seconds.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 text-xs sm:text-sm font-bold shadow-lg transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Log In with Access Code</span>
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-3 text-xs sm:text-sm font-bold transition"
                >
                  <span>Register &amp; Get Code</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
