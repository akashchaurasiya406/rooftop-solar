import { NextResponse, type NextRequest } from "next/server";
import { canAccess, homeFor, SESSION_COOKIE, verifySession } from "@/lib/auth/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);

  if (session && (pathname === "/login" || pathname === "/signup")) {
    return NextResponse.redirect(new URL(homeFor(session.role), req.url));
  }

  if (!canAccess(pathname, session?.role ?? null)) {
    if (!session) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/sales/:path*", "/admin/:path*", "/my/:path*", "/login", "/signup"],
};
