import { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth";

export function requireSession(req: NextRequest) {
  // 1. Check admin session cookie first
  const adminToken = req.cookies.get("kcse_admin_session")?.value;
  if (adminToken) {
    const adminSession = verifySession(adminToken);
    if (adminSession) return adminSession;
  }

  // 2. Check general session cookie
  const userToken = req.cookies.get("kcse_session")?.value;
  if (userToken) {
    const userSession = verifySession(userToken);
    if (userSession) return userSession;
  }

  // 3. Check Authorization header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearerToken = authHeader.slice(7).trim();
    const bearerSession = verifySession(bearerToken);
    if (bearerSession) return bearerSession;
  }

  return null;
}

export function requireAdminSession(req: NextRequest) {
  const session = requireSession(req);
  return session && session.role === "ADMIN" ? session : null;
}

