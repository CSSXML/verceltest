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

// 更新會員；password 有填才更新（重新以 pgcrypto 加密）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
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
  if (!account || !mail) {
    return NextResponse.json({ error: "account、mail 為必填" }, { status: 400 });
  }
  const finalRole = role === "admin" ? "admin" : "sales";

  // 有填密碼才檢查強度（留空代表不變更）
  if (password && password.trim() !== "") {
    const ruleError = validatePassword(password);
    if (ruleError) {
      return NextResponse.json({ error: ruleError }, { status: 400 });
    }
  }

  const finalMustChange = mustChange === true;

  try {
    let rows;
    if (password && password.trim() !== "") {
      rows = await query(
        `UPDATE member
            SET account = $1, mail = $2, role = $3,
                password = crypt($4, gen_salt('bf')),
                must_change_password = $5
          WHERE id = $6
        RETURNING id, account, mail, role, must_change_password`,
        [account, mail, finalRole, password, finalMustChange, id]
      );
    } else {
      rows = await query(
        `UPDATE member
            SET account = $1, mail = $2, role = $3,
                must_change_password = $4
          WHERE id = $5
        RETURNING id, account, mail, role, must_change_password`,
        [account, mail, finalRole, finalMustChange, id]
      );
    }
    if (rows.length === 0) {
      return NextResponse.json({ error: "找不到會員" }, { status: 404 });
    }
    return NextResponse.json({ member: rows[0] });
  } catch (e: any) {
    if (e?.code === "23505") {
      return NextResponse.json(
        { error: "account 或 mail 已存在" },
        { status: 409 }
      );
    }
    console.error("update member error", e);
    return NextResponse.json({ error: "伺服器錯誤" }, { status: 500 });
  }
}

// 刪除會員（不可刪除自己）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "無效的 id" }, { status: 400 });
  }
  if (id === session.uid) {
    return NextResponse.json({ error: "無法刪除自己的帳號" }, { status: 400 });
  }

  const rows = await query(`DELETE FROM member WHERE id = $1 RETURNING id`, [id]);
  if (rows.length === 0) {
    return NextResponse.json({ error: "找不到會員" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
