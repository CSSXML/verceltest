import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { validatePassword } from "@/lib/password";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  // 尚未完成首次改密碼者不得操作管理功能
  if (!session || session.role !== "admin" || session.mustChange) return null;
  return session;
}

// 列出所有會員
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }
  const rows = await query(
    `SELECT id, account, mail, role, must_change_password
       FROM member ORDER BY id`
  );
  return NextResponse.json({ members: rows });
}

// 新增會員（密碼以 pgcrypto bcrypt 加密）
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  let body: {
    account?: string;
    mail?: string;
    password?: string;
    role?: string;
    mustChange?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const { account, mail, password, role, mustChange } = body;
  if (!account || !mail || !password) {
    return NextResponse.json(
      { error: "account、mail、password 為必填" },
      { status: 400 }
    );
  }

  const ruleError = validatePassword(password);
  if (ruleError) {
    return NextResponse.json({ error: ruleError }, { status: 400 });
  }

  const finalRole = role === "admin" ? "admin" : "sales";

  // 新建帳號預設要求首次登入自行變更密碼，管理員可取消勾選
  const finalMustChange = mustChange !== false;

  try {
    const rows = await query(
      `INSERT INTO member (account, mail, password, role, must_change_password)
       VALUES ($1, $2, crypt($3, gen_salt('bf')), $4, $5)
       RETURNING id, account, mail, role, must_change_password`,
      [account, mail, password, finalRole, finalMustChange]
    );
    return NextResponse.json({ member: rows[0] }, { status: 201 });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "account 或 mail 已存在" },
        { status: 409 }
      );
    }
    console.error("create member error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}
