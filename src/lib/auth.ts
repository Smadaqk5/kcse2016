import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "kcse_session";
const ADMIN_COOKIE = "kcse_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 24 hours
const JWT_FALLBACK_SECRET = "kcse-secure-jwt-session-secret-key-2026";

type SessionPayload = {
  userId: string;
  role: "ADMIN" | "SUBSCRIBER";
  username: string;
  phone?: string;
};

export async function hashPassword(raw: string) {
  return bcrypt.hash(raw, 12);
}

export async function comparePassword(raw: string, hash: string) {
  return bcrypt.compare(raw, hash);
}

export function signSession(payload: SessionPayload) {
  const secret = process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
  return jwt.sign(payload, secret, { expiresIn: "24h" });
}

export function verifySession(token: string): SessionPayload | null {
  const secret = process.env.JWT_SECRET || JWT_FALLBACK_SECRET;
  try {
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setUserSession(payload: SessionPayload) {
  const jar = await cookies();
  const token = signSession(payload);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
  jar.set(SESSION_COOKIE, token, cookieOptions);
  jar.delete(ADMIN_COOKIE);
  return token;
}

export async function setAdminSession(payload: SessionPayload) {
  const jar = await cookies();
  const token = signSession(payload);
  const cookieOptions = {
    httpOnly: true,
    sameSite: "none" as const,
    secure: true,
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  };
  // Set both admin-specific cookie and general session cookie to guarantee access
  jar.set(ADMIN_COOKIE, token, cookieOptions);
  jar.set(SESSION_COOKIE, token, cookieOptions);
  return token;
}

export async function clearSessions() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ADMIN_COOKIE);
}

export function getSessionFromRequest(req: NextRequest) {
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;
  if (adminToken) {
    const adminSession = verifySession(adminToken);
    if (adminSession) return adminSession;
  }
  const userToken = req.cookies.get(SESSION_COOKIE)?.value;
  if (userToken) {
    const userSession = verifySession(userToken);
    if (userSession) return userSession;
  }
  return null;
}
