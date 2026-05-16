import Link from "next/link";
import { getCurrentSession } from "@/lib/session";
import { StkForm } from "@/components/forms/stk-form";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await getCurrentSession();
  const fallbackPlans = [
    { id: "daily", name: "Daily Access", subscriptionType: "DAILY" as const, amount: 49, durationDays: 1 },
    { id: "weekly", name: "Weekly Access", subscriptionType: "WEEKLY" as const, amount: 199, durationDays: 7 },
    { id: "monthly", name: "Monthly Access", subscriptionType: "MONTHLY" as const, amount: 599, durationDays: 30 },
  ];
  let plans = fallbackPlans;

  try {
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
  } catch {
    // Falls back to defaults if the new table has not been migrated yet.
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.name} className="rounded-xl bg-white p-5 border border-slate-200 shadow-sm">
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="text-slate-600">{plan.durationDays} days</p>
            <p className="mt-3 text-2xl font-bold">KES {plan.amount}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-100 p-5">
        {session?.role === "SUBSCRIBER" ? (
          <StkForm
            compact
            packages={plans}
          />
        ) : (
          <p className="text-slate-700">
            To pay with Lipana STK Push, please{" "}
            <Link href="/login" className="font-semibold text-emerald-700 underline">
              login as a subscriber
            </Link>
            .
          </p>
        )}
      </div>
    </section>
  );
}
