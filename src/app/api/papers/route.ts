import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { fetchPapersFromFirestore } from "@/lib/firebase-db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").toLowerCase();
  const course = (searchParams.get("course") ?? "").toLowerCase();
  const semester = (searchParams.get("semester") ?? "").toLowerCase();

  const [prismaPapers, firestorePapers] = await Promise.all([
    prisma.paper
      .findMany({
        where: {
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          unitCode: true,
          topic: true,
          course: true,
          semester: true,
          price: true,
          contentType: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    fetchPapersFromFirestore().catch(() => []),
  ]);

  const map = new Map<string, Record<string, unknown>>();
  for (const p of prismaPapers) {
    map.set(p.id, {
      ...p,
      price: Number(p.price),
    });
  }
  for (const fp of firestorePapers) {
    if (fp.isPublished !== false) {
      map.set(fp.id, {
        id: fp.id,
        title: fp.title,
        unitCode: fp.unitCode,
        topic: fp.topic,
        course: fp.course,
        semester: fp.semester,
        price: Number(fp.price),
        contentType: fp.contentType,
        createdAt: fp.createdAt ? new Date(fp.createdAt) : new Date(),
      });
    }
  }

  let list = Array.from(map.values()).sort(
    (a, b) => new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime()
  );

  if (query) {
    list = list.filter(
      (p) =>
        String(p.title || "").toLowerCase().includes(query) ||
        String(p.unitCode || "").toLowerCase().includes(query) ||
        String(p.topic || "").toLowerCase().includes(query)
    );
  }
  if (course) {
    list = list.filter((p) => String(p.course || "").toLowerCase() === course);
  }
  if (semester) {
    list = list.filter((p) => String(p.semester || "").toLowerCase() === semester);
  }

  return NextResponse.json(list);
}
