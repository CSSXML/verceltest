import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PDF_BUCKET } from "@/lib/pdfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  let body: { path?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const path = body.path?.trim();
  if (!path || path.includes("..") || path.includes("/")) {
    return NextResponse.json({ error: "路徑無效" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(PDF_BUCKET).remove([path]);
  if (error) {
    console.error("pdfs delete", error);
    return NextResponse.json({ error: "刪除失敗" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
