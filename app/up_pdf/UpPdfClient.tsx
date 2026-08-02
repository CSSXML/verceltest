"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PDF_PAGE_SIZE, MAX_PDF_BYTES } from "@/lib/pdfs";

type PdfItem = {
  name: string;
  signedUrl: string;
  createdAt: string | null;
  size: number | null;
};

function formatSize(bytes: number | null): string {
  if (bytes == null || Number.isNaN(Number(bytes))) return "—";
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UpPdfClient({ account }: { account: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<FileList | null>(null);
  const [pdfs, setPdfs] = useState<PdfItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    const res = await fetch(`/api/pdfs?page=${p}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "讀取失敗");
      return;
    }
    setPdfs(data.pdfs);
    setPage(data.page);
    setTotal(data.total);
    setError("");
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!selected || selected.length === 0) {
      setError("請選擇 PDF");
      return;
    }

    for (const file of Array.from(selected)) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".pdf")) {
        setError(`${file.name}: 僅支援 PDF 格式`);
        return;
      }
      if (file.size <= 0) {
        setError(`${file.name}: 檔案為空`);
        return;
      }
      if (file.size > MAX_PDF_BYTES) {
        setError(`${file.name}: 單檔不可超過 10MB`);
        return;
      }
    }

    setLoading(true);
    try {
      const form = new FormData();
      Array.from(selected).forEach((f) => form.append("files", f));
      const res = await fetch("/api/pdfs", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上傳失敗");
        return;
      }
      setSelected(null);
      const input = document.getElementById(
        "pdf-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      await load(1);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (name: string) => {
    if (!confirm(`確定刪除 ${name}？`)) return;
    const res = await fetch("/api/pdfs/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "刪除失敗");
      return;
    }
    const nextTotal = total - 1;
    const maxPage = Math.max(1, Math.ceil(nextTotal / PDF_PAGE_SIZE));
    await load(Math.min(page, maxPage));
  };

  const totalPages = Math.max(1, Math.ceil(total / PDF_PAGE_SIZE));
  const showPager = total > PDF_PAGE_SIZE;

  return (
    <div className="container">
      <div className="topbar">
        <h2>
          <i className="fa-solid fa-file-pdf" />
          PDF 上傳
          <span className="who">
            <i className="fa-solid fa-circle-user" />
            {account}
          </span>
        </h2>
        <div className="actions">
          <button className="btn secondary" onClick={() => router.push("/admin")}>
            <i className="fa-solid fa-users-gear" />
            返回管理
          </button>
          <button
            className="btn secondary"
            onClick={() => router.push("/up_photo")}
          >
            <i className="fa-solid fa-image" />
            圖片上傳
          </button>
          <button
            className="btn secondary"
            onClick={() => router.push("/showdata")}
          >
            <i className="fa-solid fa-arrow-left" />
            返回統計
          </button>
        </div>
      </div>

      <div className="card reveal" style={{ marginBottom: 22 }}>
        <h3 className="section-title">
          <i className="fa-solid fa-cloud-arrow-up" />
          選擇並上傳
        </h3>
        <form onSubmit={upload} className="photo-upload-form">
          <input
            id="pdf-input"
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={(e) => setSelected(e.target.files)}
          />
          {selected && selected.length > 0 && (
            <p className="muted">
              已選 {selected.length} 個檔案
              {" · "}
              {Array.from(selected)
                .map((f) => `${f.name} (${(f.size / 1024).toFixed(0)} KB)`)
                .join("、")}
            </p>
          )}
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit" disabled={loading}>
            <i className="fa-solid fa-upload" />
            {loading ? "上傳中…" : "上傳"}
          </button>
        </form>
      </div>

      <div className="card reveal" style={{ animationDelay: "80ms" }}>
        <h3 className="section-title">
          <i className="fa-solid fa-folder-open" />
          已上傳 PDF
          <span className="who">共 {total} 個</span>
        </h3>

        {pdfs.length === 0 ? (
          <p className="muted">尚無 PDF</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>檔名</th>
                  <th>大小</th>
                  <th>上傳時間</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {pdfs.map((p) => (
                  <tr key={p.name}>
                    <td>
                      <a
                        href={p.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="pdf-link"
                      >
                        <i className="fa-solid fa-file-pdf" />
                        {p.name}
                      </a>
                    </td>
                    <td>{formatSize(p.size)}</td>
                    <td>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString("zh-TW")
                        : "—"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn secondary"
                        onClick={() => remove(p.name)}
                      >
                        <i className="fa-solid fa-trash" />
                        刪除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showPager && (
          <div className="pager">
            <button
              className="btn secondary"
              type="button"
              disabled={page <= 1}
              onClick={() => load(page - 1)}
            >
              上一頁
            </button>
            <span>
              第 {page} / {totalPages} 頁
            </span>
            <button
              className="btn secondary"
              type="button"
              disabled={page >= totalPages}
              onClick={() => load(page + 1)}
            >
              下一頁
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
