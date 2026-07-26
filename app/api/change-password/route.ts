import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifySession, signSession, SESSION_COOKIE } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "尚未登入" }, { status: 401 });
  }

  let body: { password?: string; confirm?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const { password, confirm } = body;

  const ruleError = validatePassword(password);
  if (ruleError) {
    return NextResponse.json({ error: ruleError }, { status: 400 });
  }
  if (password !== confirm) {
    return NextResponse.json({ error: "兩次輸入的密碼不一致" }, { status: 400 });
  }

  // 不可與原密碼相同
  try {
    const same = await query(
      `SELECT 1 FROM member WHERE id = $1 AND password = crypt($2, password)`,
      [session.uid, password]
    );
    if (same.length > 0) {
      return NextResponse.json(
        { error: "新密碼不可與目前密碼相同" },
        { status: 400 }
      );
    }

    const rows = await query<{ id: number; account: string; role: "sales" | "admin" }>(
      `UPDATE member
          SET password = crypt($1, gen_salt('bf')),
              must_change_password = false
        WHERE id = $2
      RETURNING id, account, role`,
      [password, session.uid]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "找不到會員" }, { status: 404 });
    }

    const m = rows[0];
    // 重新簽發 session，解除 mustChange 限制
    const newToken = await signSession({
      uid: m.id,
      account: m.account,
      role: m.role,
      mustChange: false,
    });

    const res = NextResponse.json({ ok: true, role: m.role });
    res.cookies.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return res;
  } catch (e) {
    console.error("change password error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
