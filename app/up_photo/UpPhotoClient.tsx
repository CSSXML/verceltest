"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PHOTO_PAGE_SIZE,
  MAX_PHOTO_BYTES,
  ALLOWED_PHOTO_TYPES,
} from "@/lib/photos";

type Photo = { name: string; signedUrl: string; createdAt: string | null };

export default function UpPhotoClient({ account }: { account: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<FileList | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number) => {
    const res = await fetch(`/api/photos?page=${p}`);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "讀取失敗");
      return;
    }
    setPhotos(data.photos);
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
      setError("請選擇圖片");
      return;
    }

    for (const file of Array.from(selected)) {
      if (!ALLOWED_PHOTO_TYPES.has(file.type)) {
        setError(`${file.name}: 僅支援 jpg / png / webp / gif 格式`);
        return;
      }
      if (file.size <= 0) {
        setError(`${file.name}: 檔案為空`);
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setError(`${file.name}: 單檔不可超過 5MB`);
        return;
      }
    }

    setLoading(true);
    try {
      const form = new FormData();
      Array.from(selected).forEach((f) => form.append("files", f));
      const res = await fetch("/api/photos", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "上傳失敗");
        return;
      }
      setSelected(null);
      const input = document.getElementById(
        "photo-input"
      ) as HTMLInputElement | null;
      if (input) input.value = "";
      await load(1);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (name: string) => {
    if (!confirm(`確定刪除 ${name}？`)) return;
    const res = await fetch("/api/photos/delete", {
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
    const maxPage = Math.max(1, Math.ceil(nextTotal / PHOTO_PAGE_SIZE));
    await load(Math.min(page, maxPage));
  };

  const totalPages = Math.max(1, Math.ceil(total / PHOTO_PAGE_SIZE));
  const showPager = total > PHOTO_PAGE_SIZE;

  return (
    <div className="container">
      <div className="topbar">
        <h2>
          <i className="fa-solid fa-image" />
          圖片上傳
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
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
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
          <i className="fa-solid fa-images" />
          已上傳圖片
          <span className="who">共 {total} 張</span>
        </h3>

        {photos.length === 0 ? (
          <p className="muted">尚無圖片</p>
        ) : (
          <div className="photo-grid">
            {photos.map((p) => (
              <div className="photo-tile" key={p.name}>
                <button
                  type="button"
                  className="btn secondary del"
                  title="刪除"
                  onClick={() => remove(p.name)}
                >
                  <i className="fa-solid fa-trash" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.signedUrl} alt={p.name} />
                <div className="meta">{p.name}</div>
              </div>
            ))}
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
