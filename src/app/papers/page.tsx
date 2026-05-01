import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PapersPage() {
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

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <h1 className="text-3xl font-bold">Papers</h1>
      {dbOffline && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Database is currently unreachable. Check your DATABASE_URL (Supabase / Postgres) and refresh this page.
        </div>
      )}
      <div className="grid gap-4">
        {papers.map((paper) => (
          <article key={paper.id} className="rounded-xl bg-white border border-slate-200 p-4">
            <h2 className="font-semibold">{paper.title}</h2>
            <p className="text-sm text-slate-600">{paper.unitCode} • {paper.topic} • {paper.course} • Semester {paper.semester}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-medium">KES {String(paper.price)}</span>
              <Link className="rounded bg-slate-900 px-3 py-1.5 text-white text-sm" href={`/papers/${paper.id}/view`}>
                Open Viewer
              </Link>
            </div>
          </article>
        ))}
        {!dbOffline && papers.length === 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 text-slate-600">
            No papers uploaded yet.
          </div>
        )}
      </div>
    </section>
  );
}
