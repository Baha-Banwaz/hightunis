import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifySessionToken } from "@/lib/admin-session";

// Gate for everything admin. This is the outer layer only - each
// /api/admin route handler re-verifies the same cookie itself, so a proxy
// bypass (a class of bug Next.js has shipped more than once) still cannot
// reach data.
//
// Unauthenticated exceptions, both of which must stay open for login to work:
//   /admin/login      - the form
//   /api/admin/login  - POST to sign in, DELETE to sign out

const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next();

  const authed = await verifySessionToken(request.cookies.get(ADMIN_COOKIE)?.value);
  if (authed) return NextResponse.next();

  // API callers get a status they can branch on; the admin pages already
  // redirect to /admin/login when a fetch returns 401.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const loginUrl = new URL("/admin/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // "/admin" is listed explicitly rather than relying on ":path*" matching
  // the bare segment.
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
