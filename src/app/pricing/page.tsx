import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { StkForm } from "@/components/forms/stk-form";
import { prisma } from "@/lib/prisma";
import { Zap, CheckCircle2, Lock, KeyRound } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getCurrentSession();
  const fallbackPlans = [
    { id: "daily", name: "Daily Access Pass", subscriptionType: "DAILY" as const, amount: 1500, durationDays: 1 },
    { id: "weekly", name: "Weekly Exam Booster", subscriptionType: "WEEKLY" as const, amount: 5000, durationDays: 7 },
    { id: "monthly", name: "Monthly VIP Pass", subscriptionType: "MONTHLY" as const, amount: 12000, durationDays: 30 },
  ];
  let plans = fallbackPlans;

  try {
    const dbPlans = await prisma.subscriptionPackage.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (dbPlans.length > 0) {
      plans = dbPlans.map((plan) => {
        let amount = Number(plan.amount);
        let durationDays = plan.durationDays;
        // Auto-align default legacy prices if they were old defaults (< 1500)
        if (plan.subscriptionType === "DAILY") {
          if (amount < 1500) amount = 1500;
          durationDays = 1;
        } else if (plan.subscriptionType === "WEEKLY") {
          if (amount < 5000) amount = 5000;
          durationDays = 7;
        } else if (plan.subscriptionType === "MONTHLY") {
          if (amount < 12000) amount = 12000;
          durationDays = 30;
        }
        return {
          id: plan.id,
          name: plan.name,
          subscriptionType: plan.subscriptionType,
          amount,
          durationDays,
        };
      });
    }
  } catch {
    // Falls back to defaults
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <Zap className="w-3.5 h-3.5 text-emerald-600" />
            Instant M-Pesa Express Activation
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            KCSE Revision Subscription Plans
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Gain immediate, unrestricted, view-only access to all verified KCSE past papers, marking schemes, and predicted national mocks.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const isWeekly = plan.subscriptionType === "WEEKLY";
            return (
              <div
                key={plan.name}
                className={`rounded-2xl bg-white p-6 border transition-all relative flex flex-col justify-between ${
                  isWeekly
                    ? "border-emerald-700 shadow-md ring-1 ring-emerald-700"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {isWeekly && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{plan.name}</h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {plan.durationDays === 1
                        ? "Ideal for quick evening revision"
                        : plan.durationDays === 7
                        ? "Best value for mock exam season"
                        : "Complete syllabus mastery pass"}
                    </p>
                  </div>

                  <div className="pt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900">
                      KES {plan.amount}
                    </span>
                    <span className="text-xs text-slate-500 ml-1.5">
                      / {plan.durationDays} {plan.durationDays === 1 ? "day" : "days"}
                    </span>
                  </div>

                  <ul className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full access to all 8+ subject papers</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Official KNEC point-by-point marking schemes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Anti-leak personalized digital viewer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant Lipa na M-Pesa STK push checkout</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  {session ? (
                    <div className="text-center">
                      <span className="text-xs font-semibold text-emerald-700">
                        Select this plan in the M-Pesa box below ↓
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors ${
                        isWeekly
                          ? "bg-emerald-700 text-white hover:bg-emerald-800"
                          : "bg-slate-900 text-white hover:bg-slate-800"
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
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center space-y-3 shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-700">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Ready to activate access?</h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                Sign in with your unique Access Code to initiate direct Lipa na M-Pesa payment.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Sign In with Access Code
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50 transition-colors"
                >
                  Get New Access Code
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Unique Candidate Access Code Security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Direct Lipa na M-Pesa STK Push</span>
          </div>
        </div>
      </div>
    </div>
  );
}
