import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { hasActiveSubscription } from "@/lib/access";
import { StkForm } from "@/components/forms/stk-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUBSCRIBER") redirect("/login");

  const fallbackPackages = [
    { id: "daily", name: "Daily Access", subscriptionType: "DAILY" as const, amount: 49, durationDays: 1 },
    { id: "weekly", name: "Weekly Access", subscriptionType: "WEEKLY" as const, amount: 199, durationDays: 7 },
    { id: "monthly", name: "Monthly Access", subscriptionType: "MONTHLY" as const, amount: 599, durationDays: 30 },
  ];

  const [subscription, purchases, papers, packages] = await Promise.all([
    hasActiveSubscription(session.userId),
    prisma.paperPurchase.findMany({ where: { userId: session.userId }, include: { paper: true } }),
    prisma.paper.findMany({ where: { isPublished: true }, take: 50 }),
    prisma.subscriptionPackage
      .findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
      .catch(() => []),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">User Dashboard</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p>Logged in as <b>{session.username}</b></p>
        <p className="text-slate-600">
          Subscription: {subscription ? `Active until ${dayjs(subscription.expiresAt).format("DD MMM YYYY HH:mm")}` : "Not active"}
        </p>
      </div>
      <StkForm
        packages={(packages.length ? packages : fallbackPackages).map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          subscriptionType: pkg.subscriptionType,
          amount: Number(pkg.amount),
          durationDays: pkg.durationDays,
        }))}
      />
      <div className="grid gap-3">
        <h2 className="text-xl font-semibold">Accessible Papers</h2>
        {papers.map((paper) => {
          const bought = purchases.find((p) => p.paperId === paper.id);
          const allowed = Boolean(subscription || bought);
          return (
            <div key={paper.id} className="rounded-lg border bg-white p-3 flex items-center justify-between">
              <span>{paper.title}</span>
              {allowed ? (
                <Link className="rounded bg-slate-900 px-3 py-1.5 text-sm text-white" href={`/papers/${paper.id}/view`}>Open</Link>
              ) : (
                <span className="text-sm text-slate-500">Buy to access</span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
