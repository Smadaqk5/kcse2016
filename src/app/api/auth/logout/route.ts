import { NextResponse } from "next/server";
import { clearSessions } from "@/lib/auth";

export async function POST(request: Request) {
  await clearSessions();
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  return NextResponse.json({ ok: true, redirect: "/login" });
}
