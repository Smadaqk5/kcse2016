import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const course = searchParams.get("course") ?? "";
  const semester = searchParams.get("semester") ?? "";

  const papers = await prisma.paper.findMany({
    where: {
      isPublished: true,
      title: { contains: query },
      course: course ? course : undefined,
      semester: semester ? semester : undefined,
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
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(papers);
}
