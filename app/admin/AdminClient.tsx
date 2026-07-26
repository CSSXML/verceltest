"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Member {
  id: number;
  account: string;
  mail: string;
  role: "sales" | "admin";
}

const emptyForm = { account: "", mail: "", password: "", role: "sales" };

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
    setForm({ account: m.account, mail: m.mail, password: "", role: m.role });
    setError("");
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

  return (
    <div className="container">
      <div className="topbar">
        <h2>會員管理</h2>
        <div className="actions">
          <button className="btn secondary" onClick={() => router.push("/showdata")}>
            返回統計
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 12 }}>
          {editingId ? `編輯會員 #${editingId}` : "新增會員"}
        </h3>
        <div className="error">{error}</div>
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="field">
              <label>account</label>
              <input
                value={form.account}
                onChange={(e) => setForm({ ...form, account: e.target.value })}
              />
            </div>
            <div className="field">
              <label>mail</label>
              <input
                type="email"
                value={form.mail}
                onChange={(e) => setForm({ ...form, mail: e.target.value })}
              />
            </div>
            <div className="field">
              <label>
                password {editingId && <small>(留空則不變更)</small>}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="field">
              <label>role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #cbd2d9" }}
              >
                <option value="sales">sales</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div className="field">
              <label>&nbsp;</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" type="submit" disabled={loading}>
                  {editingId ? "更新" : "新增"}
                </button>
                {editingId && (
                  <button
                    className="btn secondary"
                    type="button"
                    onClick={resetForm}
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          </div>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>account</th>
            <th>mail</th>
            <th>role</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.id}</td>
              <td>{m.account}</td>
              <td>{m.mail}</td>
              <td>
                <span className={`badge ${m.role === "admin" ? "admin" : ""}`}>
                  {m.role}
                </span>
              </td>
              <td>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn small secondary" onClick={() => startEdit(m)}>
                    編輯
                  </button>
                  <button
                    className="btn small danger"
                    onClick={() => remove(m.id)}
                    disabled={m.id === meId}
                    title={m.id === meId ? "無法刪除自己" : ""}
                  >
                    刪除
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {members.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "#94a3b8" }}>
                尚無會員
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
