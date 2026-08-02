import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

const PROTECTED = ["/showdata", "/admin", "/change-password", "/up_photo"];
const ADMIN_ONLY = ["/admin", "/up_photo"];

const match = (pathname: string, list: string[]) =>
  list.some((p) => pathname === p || pathname.startsWith(p + "/"));

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!match(pathname, PROTECTED)) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  // 未登入 → 回登入頁
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const onChangePage = pathname === "/change-password";

  // 尚未完成首次改密碼 → 一律導到改密碼頁
  if (session.mustChange && !onChangePage) {
    const url = req.nextUrl.clone();
    url.pathname = "/change-password";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // 已改過密碼卻想再進改密碼頁 → 導回統計頁
  if (!session.mustChange && onChangePage) {
    const url = req.nextUrl.clone();
    url.pathname = "/showdata";
    return NextResponse.redirect(url);
  }

  // 非 admin 想進管理頁
  if (match(pathname, ADMIN_ONLY) && session.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/showdata";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/showdata/:path*",
    "/admin/:path*",
    "/change-password/:path*",
    "/up_photo/:path*",
  ],
};
