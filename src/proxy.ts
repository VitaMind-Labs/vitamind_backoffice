import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE, SIGNIN_PATH } from "@/lib/auth/constants";

/**
 * Optimistic route protection: /admin/* requires an admin session cookie.
 * The session is verified by the backend on every call (/auth/admin/me and
 * each /api/v1/admin request); this only avoids rendering the shell for
 * visitors who are clearly signed out.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE);
  if (hasSession) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = SIGNIN_PATH;
  url.search = "";
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== "/admin") url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
