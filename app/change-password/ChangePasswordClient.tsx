"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_RULE } from "@/lib/password";

export default function ChangePasswordClient({ account }: { account: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 即時規則檢查（顯示用；實際以伺服器驗證為準）
  const checks = [
    { ok: password.length >= 8, text: "至少 8 碼" },
    { ok: /[A-Z]/.test(password), text: "含大寫英文" },
    { ok: /[a-z]/.test(password), text: "含小寫英文" },
    { ok: /[0-9]/.test(password), text: "含數字" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "變更失敗");
        return;
      }
      router.push("/showdata");
      router.refresh();
    } catch {
      setError("網路錯誤，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <h1>首次登入 — 請設定新密碼</h1>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, textAlign: "center" }}>
          帳號：{account}
        </p>
        <div className="error">{error}</div>

        <div className="field">
          <label>新密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="field">
          <label>確認新密碼</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <ul style={{ listStyle: "none", fontSize: 13, marginBottom: 16 }}>
          {checks.map((c) => (
            <li key={c.text} style={{ color: c.ok ? "#059669" : "#94a3b8" }}>
              {c.ok ? "✓" : "○"} {c.text}
            </li>
          ))}
          <li
            style={{
              color:
                confirm.length > 0 && password === confirm ? "#059669" : "#94a3b8",
            }}
          >
            {confirm.length > 0 && password === confirm ? "✓" : "○"} 兩次輸入一致
          </li>
        </ul>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "設定中…" : "確認變更"}
        </button>

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 12 }}>
          {PASSWORD_RULE}
        </p>
      </form>
    </div>
  );
}
