import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  canAccess,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type Role,
  type Session,
} from "./session";

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

export async function startSession(s: Session): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signSession(s), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Use at the top of every protected page and server action.
 * Middleware already blocks the wrong roles; this is the second check,
 * so access control never depends on a single layer.
 */
export async function requireRole(...roles: Role[]): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!roles.includes(session.role)) redirect("/forbidden");
  return session;
}

export { canAccess };
