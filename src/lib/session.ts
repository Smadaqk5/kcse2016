import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

export async function getCurrentSession() {
  const jar = await cookies();
  const token =
    jar.get("kcse_session")?.value || jar.get("kcse_admin_session")?.value || "";
  if (!token) return null;
  return verifySession(token);
}
