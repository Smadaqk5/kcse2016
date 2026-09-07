import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function getCurrentSession() {
  const jar = await cookies();

  // 1. Check admin token first
  const adminToken = jar.get("kcse_admin_session")?.value;
  if (adminToken) {
    const adminSession = verifySession(adminToken);
    if (adminSession && adminSession.role === "ADMIN") {
      return adminSession;
    }
  }

  // 2. Check general session
  const userToken = jar.get("kcse_session")?.value;
  if (userToken) {
    const userSession = verifySession(userToken);
    if (userSession) return userSession;
  }

  return null;
}

export async function getAdminSession() {
  const session = await getCurrentSession();
  if (session && session.role === "ADMIN") {
    return session;
  }
  return null;
}

