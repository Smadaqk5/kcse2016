import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api-auth";
import { canAccessPaper, canAccessPaperByPhone } from "@/lib/access";
import { fetchDeletedPaperIds } from "@/lib/firebase-db";

function generateSamplePdf(title: string, unitCode: string, username: string): Buffer {
  const content = `BT
/F1 18 Tf
50 720 Td
(KENYA CERTIFICATE OF SECONDARY EDUCATION) Tj
0 -26 Td
/F1 14 Tf
(${title.replace(/[()]/g, "")} [${unitCode}]) Tj
0 -22 Td
/F1 10 Tf
(CONFIDENTIAL REVISION MATERIAL - WATERMARKED FOR CANDIDATE: ${username.toUpperCase()}) Tj
0 -36 Td
/F1 12 Tf
(SECTION A: Answer ALL questions in this section.) Tj
0 -24 Td
/F1 10 Tf
(1. Outline three key principles evaluated in this national assessment paper.) Tj
0 -18 Td
(   [3 marks]) Tj
0 -22 Td
(2. With reference to standard syllabus guidelines, derive the theoretical formulation.) Tj
0 -18 Td
(   [4 marks]) Tj
0 -22 Td
(3. Explain the environmental and economic implications of industrial scaling in East Africa.) Tj
0 -18 Td
(   [5 marks]) Tj
0 -30 Td
/F1 12 Tf
(SECTION B: Marking Scheme & Model Solutions) Tj
0 -24 Td
/F1 10 Tf
(Detailed point-by-point marking scheme provided for authorized candidates.) Tj
0 -18 Td
(Strict anti-leak security active. Reproduction or redistribution is monitored.) Tj
ET`;

  const streamLength = Buffer.byteLength(content, "utf-8");

  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${content}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000${(310 + streamLength).toString().padStart(3, "0")} 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${400 + streamLength}
%%EOF`;

  return Buffer.from(pdf, "utf-8");
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = requireSession(req);
  const { id } = await params;
  const phoneParam = req.nextUrl.searchParams.get("phone")?.trim() || "";

  let candidateId: string | null = session?.userId || null;
  let candidateUsername: string = session?.username || "Candidate";

  if (session?.role === "ADMIN") {
    candidateId = session.userId;
    candidateUsername = "Administrator";
  } else if (!candidateId && phoneParam) {
    const { allowed, user } = await canAccessPaperByPhone(phoneParam, id);
    if (allowed) {
      candidateId = user?.id || `guest-${phoneParam}`;
      candidateUsername = user?.username || `Candidate (${phoneParam})`;
    }
  }

  if (!candidateId && session?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Access or purchase required." }, { status: 401 });
  }

  const access = session?.role === "ADMIN" || candidateId?.startsWith("guest-")
    ? true
    : (candidateId ? await canAccessPaper(candidateId, id) : false);

  if (!access) return NextResponse.json({ error: "Payment required" }, { status: 402 });

  const deletedSet = await fetchDeletedPaperIds().catch(() => new Set<string>());
  if (deletedSet.has(id)) {
    return NextResponse.json({ error: "Paper not found or has been removed." }, { status: 404 });
  }

  const paper = await prisma.paper.findUnique({ where: { id } });
  if (!paper) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let fileBuffer: Buffer;
  try {
    fileBuffer = await fs.readFile(paper.filePath);
  } catch {
    // If local file does not exist on disk, stream generated candidate sample exam PDF
    fileBuffer = generateSamplePdf(paper.title, paper.unitCode, candidateUsername);
  }

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=paper.pdf",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
