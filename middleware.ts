import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Read auth token from cookie (server-side)
  const token = req.cookies.get("authToken")?.value;

  // If user is authenticated and tries to access login page ('/'), redirect to dashboard
  if (token && (pathname === "/")) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If user is not authenticated and tries to access protected pages, redirect to login
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/settings") || pathname.startsWith("/api/vault");
  if (!token && isProtected) {
    const url = req.nextUrl.clone();
    url.pathname = "/"; // login page
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard',
    '/dashboard/:path*',
    '/settings/:path*',
    '/api/vault/:path*',
  ],
};
