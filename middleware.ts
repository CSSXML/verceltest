import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

// 保護的路由
const PROTECTED = ["/showdata", "/admin"];
const ADMIN_ONLY = ["/admin"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const needsAdmin = ADMIN_ONLY.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (needsAdmin && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/showdata";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/showdata/:path*", "/admin/:path*"],
};
