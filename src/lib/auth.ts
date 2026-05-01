import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "kcse_session";
const ADMIN_COOKIE = "kcse_admin_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 2;

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
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return jwt.sign(payload, secret, { expiresIn: "2h" });
}

export function verifySession(token: string): SessionPayload | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    return jwt.verify(token, secret) as SessionPayload;
  } catch {
    return null;
  }
}

export async function setUserSession(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function setAdminSession(payload: SessionPayload) {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, signSession(payload), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessions() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(ADMIN_COOKIE);
}

export function getSessionFromRequest(req: NextRequest) {
  const token =
    req.cookies.get(SESSION_COOKIE)?.value ||
    req.cookies.get(ADMIN_COOKIE)?.value ||
    "";
  return token ? verifySession(token) : null;
}
