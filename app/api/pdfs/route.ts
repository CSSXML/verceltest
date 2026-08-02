import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  PDF_BUCKET,
  PDF_PAGE_SIZE,
  SIGNED_URL_TTL_SEC,
  buildObjectPath,
  validatePdfMeta,
} from "@/lib/pdfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  const page = Math.max(
    1,
    Number(req.nextUrl.searchParams.get("page") || 1) || 1
  );
  const supabase = getSupabaseAdmin();

  const { data: all, error: listErr } = await supabase.storage
    .from(PDF_BUCKET)
    .list("", {
      limit: 1000,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (listErr) {
    console.error("pdfs list", listErr);
    return NextResponse.json({ error: "無法讀取 PDF 列表" }, { status: 500 });
  }

  const files = (all || []).filter(
    (f) => f.name && !f.name.endsWith("/") && !f.name.startsWith(".")
  );
  const total = files.length;
  const start = (page - 1) * PDF_PAGE_SIZE;
  const slice = files.slice(start, start + PDF_PAGE_SIZE);

  const pdfs = await Promise.all(
    slice.map(async (f) => {
      const { data } = await supabase.storage
        .from(PDF_BUCKET)
        .createSignedUrl(f.name, SIGNED_URL_TTL_SEC);
      return {
        name: f.name,
        signedUrl: data?.signedUrl ?? "",
        createdAt: f.created_at ?? null,
        size: f.metadata?.size ?? null,
      };
    })
  );

  return NextResponse.json({
    pdfs,
    page,
    pageSize: PDF_PAGE_SIZE,
    total,
  });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "未授權" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "請求格式錯誤" }, { status: 400 });
  }

  const files = form
    .getAll("files")
    .filter((v): v is File => typeof File !== "undefined" && v instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "請選擇 PDF" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const uploaded: string[] = [];

  for (const file of files) {
    const err = validatePdfMeta({
      type: file.type,
      size: file.size,
      name: file.name,
    });
    if (err) {
      return NextResponse.json(
        { error: `${file.name}: ${err}` },
        { status: 400 }
      );
    }
    const path = buildObjectPath(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(path, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });
    if (error) {
      console.error("pdfs upload", error);
      return NextResponse.json(
        { error: `${file.name}: 上傳失敗` },
        { status: 500 }
      );
    }
    uploaded.push(path);
  }

  return NextResponse.json({ uploaded }, { status: 201 });
}
