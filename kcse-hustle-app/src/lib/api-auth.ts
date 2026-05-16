import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export function requireSession(req: NextRequest) {
  const token =
    req.cookies.get("kcse_session")?.value ||
    req.cookies.get("kcse_admin_session")?.value ||
    "";
  const session = token ? verifySession(token) : null;
  return session;
}
