"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VisitorCounter from "./VisitorCounter";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaSrc, setCaptchaSrc] = useState("/api/captcha");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshCaptcha = () => {
    setCaptchaSrc(`/api/captcha?t=${Date.now()}`);
    setCaptcha("");
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, captcha }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "登入失敗");
        refreshCaptcha();
        return;
      }
      router.push(data.mustChange ? "/change-password" : "/showdata");
      router.refresh();
    } catch {
      setError("網路錯誤，請稍後再試");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <i className="fa-solid fa-chart-pie" />
        </div>
        <h1>會員登入</h1>
        <p className="login-sub">客戶資料統計管理系統</p>

        {error && (
          <div className="error">
            <i className="fa-solid fa-circle-exclamation" />
            {error}
          </div>
        )}

        <div className="field">
          <label>
            <i className="fa-solid fa-user" />
            帳號 或 Email
          </label>
          <div className="input-icon">
            <i className="fa-solid fa-at" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="請輸入 account 或 mail"
              autoComplete="username"
            />
          </div>
        </div>

        <div className="field">
          <label>
            <i className="fa-solid fa-lock" />
            密碼
          </label>
          <div className="input-icon">
            <i className="fa-solid fa-key" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              autoComplete="current-password"
            />
          </div>
        </div>

        <div className="field">
          <label>
            <i className="fa-solid fa-shield-halved" />
            驗證碼
          </label>
          <div className="captcha-row">
            <div className="input-icon">
              <i className="fa-solid fa-pen" />
              <input
                type="text"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                placeholder="圖中 6 碼"
                maxLength={6}
              />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="captcha-img"
              src={captchaSrc}
              alt="captcha"
              onClick={refreshCaptcha}
              title="點擊更換驗證碼"
            />
          </div>
          <div className="captcha-hint">
            <i className="fa-solid fa-rotate" />
            2 個小寫英文 + 4 個數字，點圖可更換
          </div>
        </div>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? (
            <>
              <i className="fa-solid fa-spinner fa-spin" />
              登入中…
            </>
          ) : (
            <>
              <i className="fa-solid fa-right-to-bracket" />
              登入
            </>
          )}
        </button>
      </form>
      <VisitorCounter />
    </div>
  );
}
