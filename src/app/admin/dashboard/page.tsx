import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { AdminTools } from "@/components/forms/admin-tools";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getCurrentSession();
  if (!session || session.role !== "ADMIN") redirect("/login");

  const [revenue, subscribers, popularPapers, payments] = await Promise.all([
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS" } }),
    prisma.subscription.count({ where: { isActive: true } }),
    prisma.paper.findMany({
      include: { _count: { select: { purchases: true } } },
      orderBy: { purchases: { _count: "desc" } },
      take: 5,
    }),
    prisma.payment.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Revenue</p><p className="text-2xl font-bold">KES {String(revenue._sum.amount ?? 0)}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Active Subscribers</p><p className="text-2xl font-bold">{subscribers}</p></div>
        <div className="rounded-xl border bg-white p-4"><p className="text-slate-500">Popular Papers</p><p className="text-2xl font-bold">{popularPapers.length}</p></div>
      </div>
      <AdminTools />
      <div className="rounded-xl border bg-white p-4">
        <h2 className="font-semibold mb-2">Recent Payments</h2>
        {payments.map((p) => (
          <p key={p.id} className="text-sm text-slate-700">
            {p.user.username} - KES {String(p.amount)} - {p.status}
          </p>
        ))}
      </div>
    </section>
  );
}
