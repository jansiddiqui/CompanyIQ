import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/utils/auth";

// Routes that require authentication
const PROTECTED_PATHS = [
  "/dashboard",
  "/watchlist",
  "/history",
  "/settings",
  "/architecture",
  "/research",
];

// Auth pages — redirect authenticated users away from these
const AUTH_PAGES = ["/login", "/signup"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isAuthenticated = Boolean(token);

  // Check if this is an auth page (login/signup)
  const isAuthPage = AUTH_PAGES.some((path) => pathname.startsWith(path));
  if (isAuthPage && isAuthenticated) {
    // Already logged in — send to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtectedPath && !isAuthenticated) {
    // Not logged in — send to login with return url
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/watchlist/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/architecture/:path*",
    "/research/:path*",
    "/login",
    "/signup",
  ],
};
