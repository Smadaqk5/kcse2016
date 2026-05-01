import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/session";
import { canAccessPaper } from "@/lib/access";
import { PaperViewer } from "@/components/viewer/paper-viewer";

export const dynamic = "force-dynamic";

export default async function PaperViewPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session || session.role !== "SUBSCRIBER") redirect("/login");

  const { id } = await params;
  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) notFound();

  const allowed = await canAccessPaper(session.userId, id);
  if (!allowed) redirect("/pricing");

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 space-y-4">
      <h1 className="text-2xl font-bold">{paper.title}</h1>
      <PaperViewer paperId={paper.id} username={session.username} phone={session.phone ?? "N/A"} />
    </section>
  );
}
