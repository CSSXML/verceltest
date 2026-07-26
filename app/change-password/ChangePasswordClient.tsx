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
    { ok: /[A-Z]/.test(password), text: "含大寫英文字母" },
    { ok: /[a-z]/.test(password), text: "含小寫英文字母" },
    { ok: /[0-9]/.test(password), text: "含數字" },
    {
      ok: confirm.length > 0 && password === confirm,
      text: "兩次輸入一致",
    },
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
        <div className="login-logo">
          <i className="fa-solid fa-user-shield" />
        </div>
        <h1>首次登入 · 設定新密碼</h1>
        <p className="login-sub">
          <i className="fa-solid fa-user" /> 帳號：{account}
        </p>

        {error && (
          <div className="error">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <div className="field">
          <label>
            <i className="fa-solid fa-lock" />
            新密碼
          </label>
          <div className="input-icon">
            <i className="fa-solid fa-key" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請設定新密碼"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="field">
          <label>
            <i className="fa-solid fa-lock" />
            確認新密碼
          </label>
          <div className="input-icon">
            <i className="fa-solid fa-check-double" />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="再輸入一次"
              autoComplete="new-password"
            />
          </div>
        </div>

        <ul className="rule-list">
          {checks.map((c) => (
            <li key={c.text} className={c.ok ? "done" : ""}>
              <i
                className={
                  c.ok ? "fa-solid fa-circle-check" : "fa-regular fa-circle"
                }
              />
              {c.text}
            </li>
          ))}
        </ul>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" />
              設定中…
            </>
          ) : (
            <>
              <i className="fa-solid fa-floppy-disk" />
              確認變更
            </>
          )}
        </button>

        <p
          style={{
            fontSize: 11.5,
            color: "#94a3b8",
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <i className="fa-solid fa-circle-info" />
          {PASSWORD_RULE}
        </p>
      </form>
    </div>
  );
}
