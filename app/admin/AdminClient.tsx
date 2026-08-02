"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_RULE } from "@/lib/password";

interface Member {
  id: number;
  account: string;
  mail: string;
  role: "sales" | "admin";
  must_change_password: boolean;
}

const emptyForm = {
  account: "",
  mail: "",
  password: "",
  role: "sales",
  mustChange: true,
};

export default function AdminClient({ meId }: { meId: number }) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState<typeof emptyForm>({ ...emptyForm });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/members");
    if (res.ok) {
      const data = await res.json();
      setMembers(data.members);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setError("");
  };

  const startEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({
      account: m.account,
      mail: m.mail,
      password: "",
      role: m.role,
      mustChange: m.must_change_password,
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = editingId ? `/api/members/${editingId}` : "/api/members";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "操作失敗");
        return;
      }
      resetForm();
      await load();
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: number) => {
    if (!confirm("確定刪除此會員？")) return;
    const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "刪除失敗");
      return;
    }
    await load();
  };

  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="container">
      <div className="topbar">
        <h2>
          <i className="fa-solid fa-users-gear" />
          會員管理
          <span className="who">
            <i className="fa-solid fa-user-group" />
            共 {members.length} 位 · admin {adminCount} 位
          </span>
        </h2>
        <div className="actions">
          <button className="btn" onClick={() => router.push("/up_photo")}>
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

      <div
        className="card reveal"
        style={{ marginBottom: 22, animationDelay: "60ms" }}
      >
        <h3 className="section-title">
          <i
            className={
              editingId ? "fa-solid fa-user-pen" : "fa-solid fa-user-plus"
            }
          />
          {editingId ? `編輯會員 #${editingId}` : "新增會員"}
        </h3>
        <p className="hint">
          <i className="fa-solid fa-circle-info" />
          {PASSWORD_RULE}；勾選「強制變更」後，該會員下次登入必須自行設定新密碼。
        </p>

        {error && (
          <div className="error">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>
                <i className="fa-solid fa-user" />
                account
              </label>
              <input
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
                placeholder="登入帳號"
              />
            </div>
            <div className="field">
              <label>
                <i className="fa-solid fa-envelope" />
                mail
              </label>
              <input
                type="email"
                value={form.mail}
                onChange={(e) => setForm({ ...form, mail: e.target.value })}
                placeholder="電子郵件"
              />
            </div>
            <div className="field">
              <label>
                <i className="fa-solid fa-key" />
                password{" "}
                {editingId && (
                  <span style={{ fontWeight: 400, color: "#94a3b8" }}>
                    (留空不變更)
                  </span>
                )}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder={editingId ? "不變更請留空" : "初始密碼"}
              />
            </div>
            <div className="field narrow">
              <label>
                <i className="fa-solid fa-user-tag" />
                role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="sales">sales</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="field narrow">
              <label>
                <i className="fa-solid fa-triangle-exclamation" />
                首次登入
              </label>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={form.mustChange}
                  onChange={(e) =>
                    setForm({ ...form, mustChange: e.target.checked })
                  }
                />
                強制變更
              </label>
            </div>
            <div className="field narrow">
              <label>&nbsp;</label>
              <div style={{ display: "flex", gap: 8, height: 44, alignItems: "center" }}>
                <button className="btn" type="submit" disabled={loading}>
                  <i
                    className={
                      loading
                        ? "fa-solid fa-spinner fa-spin"
                        : editingId
                        ? "fa-solid fa-floppy-disk"
                        : "fa-solid fa-plus"
                    }
                  />
                  {editingId ? "更新" : "新增"}
                </button>
                {editingId && (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={resetForm}
                  >
                    <i className="fa-solid fa-xmark" />
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="table-card reveal" style={{ animationDelay: "160ms" }}>
        <h3>
          <i className="fa-solid fa-list-ul" />
          會員清單
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><i className="fa-solid fa-hashtag" />ID</th>
                <th><i className="fa-solid fa-user" />account</th>
                <th><i className="fa-solid fa-envelope" />mail</th>
                <th><i className="fa-solid fa-user-tag" />role</th>
                <th><i className="fa-solid fa-key" />需改密碼</th>
                <th><i className="fa-solid fa-gear" />操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => (
                <tr
                  key={m.id}
                  className="row-in"
                  style={{ animationDelay: `${220 + Math.min(i, 24) * 32}ms` }}
                >
                  <td>{m.id}</td>
                  <td>
                    {m.account}
                    {m.id === meId && (
                      <span className="badge ok" style={{ marginLeft: 6 }}>
                        <i className="fa-solid fa-circle-user" />我
                      </span>
                    )}
                  </td>
                  <td>{m.mail}</td>
                  <td>
                    <span
                      className={`badge ${m.role === "admin" ? "admin" : ""}`}
                    >
                      <i
                        className={
                          m.role === "admin"
                            ? "fa-solid fa-crown"
                            : "fa-solid fa-user"
                        }
                      />
                      {m.role}
                    </span>
                  </td>
                  <td>
                    {m.must_change_password ? (
                      <span className="badge admin">
                        <i className="fa-solid fa-triangle-exclamation" />是
                      </span>
                    ) : (
                      <span className="badge no">
                        <i className="fa-solid fa-check" />否
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn small secondary"
                        onClick={() => startEdit(m)}
                      >
                        <i className="fa-solid fa-pen" />
                        編輯
                      </button>
                      <button
                        className="btn small danger"
                        onClick={() => remove(m.id)}
                        disabled={m.id === meId}
                        title={m.id === meId ? "無法刪除自己" : "刪除此會員"}
                      >
                        <i className="fa-solid fa-trash" />
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    <i className="fa-regular fa-folder-open" />
                    尚無會員
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
