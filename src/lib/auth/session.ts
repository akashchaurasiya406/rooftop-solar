// Stateless sessions: a signed JWT in an httpOnly cookie.
// This file has no Node-only imports so it also runs in middleware (edge).

import { jwtVerify, SignJWT } from "jose";

export type Role = "HOMEOWNER" | "SALES" | "ADMIN";

export interface Session {
  userId: string;
  role: Role;
  name: string;
}

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET is missing or shorter than 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ role: s.role, name: s.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    const role = payload.role;
    if (!payload.sub || (role !== "HOMEOWNER" && role !== "SALES" && role !== "ADMIN")) return null;
    return { userId: payload.sub, role, name: String(payload.name ?? "") };
  } catch {
    return null; // expired, tampered or malformed
  }
}

/** Where each role lands after signing in. */
export function homeFor(role: Role): string {
  return role === "HOMEOWNER" ? "/my" : "/sales";
}

/** Which roles may open which area. Checked in middleware AND in pages. */
export const AREA_ROLES: Record<string, Role[]> = {
  "/sales": ["SALES", "ADMIN"],
  "/admin": ["ADMIN"],
  "/my": ["HOMEOWNER"],
};

export function canAccess(pathname: string, role: Role | null): boolean {
  const area = Object.keys(AREA_ROLES).find((a) => pathname === a || pathname.startsWith(`${a}/`));
  if (!area) return true; // public page
  return role !== null && AREA_ROLES[area].includes(role);
}
