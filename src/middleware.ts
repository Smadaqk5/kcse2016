import { NextResponse, type NextRequest } from "next/server";

const protectedUserRoutes = ["/dashboard", "/papers/view"];
const protectedAdminRoutes = ["/admin/dashboard"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const userToken = request.cookies.get("kcse_session")?.value;
  const adminToken = request.cookies.get("kcse_admin_session")?.value;

  if (protectedUserRoutes.some((p) => path.startsWith(p))) {
    if (!userToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (protectedAdminRoutes.some((p) => path.startsWith(p))) {
    if (!adminToken && !userToken) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/dashboard/:path*", "/papers/view/:path*"],
};
