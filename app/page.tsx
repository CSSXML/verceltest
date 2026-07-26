"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      router.push("/showdata");
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
        <h1>會員登入</h1>
        <div className="error">{error}</div>

        <div className="field">
          <label>帳號 或 Email</label>
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="account 或 mail"
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label>密碼</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            autoComplete="current-password"
          />
        </div>

        <div className="field">
          <label>驗證碼（2 小寫字母 + 4 數字）</label>
          <div className="captcha-row">
            <input
              type="text"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              placeholder="請輸入圖中 6 碼"
              maxLength={6}
              style={{ flex: 1 }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="captcha-img"
              src={captchaSrc}
              alt="captcha"
              onClick={refreshCaptcha}
              title="點擊更換驗證碼"
            />
          </div>
        </div>

        <button className="btn btn-block" type="submit" disabled={loading}>
          {loading ? "登入中…" : "登入"}
        </button>
      </form>
    </div>
  );
}
