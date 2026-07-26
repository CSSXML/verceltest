import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signSession, SESSION_COOKIE } from "@/lib/auth";
import { verifyCaptcha, CAPTCHA_COOKIE } from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface MemberRow {
  id: number;
  account: string;
  mail: string;
  role: "sales" | "admin";
}

export async function POST(req: NextRequest) {
  let body: { identifier?: string; password?: string; captcha?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const { identifier, password, captcha } = body;

  // 1. 驗證碼
  const captchaToken = req.cookies.get(CAPTCHA_COOKIE)?.value;
  const captchaOk = await verifyCaptcha(captchaToken, captcha);
  if (!captchaOk) {
    return NextResponse.json({ error: "驗證碼錯誤或已過期" }, { status: 400 });
  }

  if (!identifier || !password) {
    return NextResponse.json({ error: "請輸入帳號與密碼" }, { status: 400 });
  }

  // 2. 帳密驗證（密碼比對由 pgcrypto 於 DB 端完成）
  let rows: MemberRow[];
  try {
    rows = await query<MemberRow>(
      `SELECT id, account, mail, role
         FROM member
        WHERE (account = $1 OR mail = $1)
          AND password = crypt($2, password)
        LIMIT 1`,
      [identifier, password]
    );
  } catch (e) {
    console.error("login query error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "帳號或密碼錯誤" }, { status: 401 });
  }

  const member = rows[0];
  const token = await signSession({
    uid: member.id,
    account: member.account,
    role: member.role,
  });

  const res = NextResponse.json({
    ok: true,
    role: member.role,
    account: member.account,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  // 用畢即清除驗證碼 cookie
  res.cookies.set(CAPTCHA_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
