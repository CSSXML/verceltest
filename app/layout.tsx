import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "會員系統 — 客戶資料統計",
  description: "Next.js + PostgreSQL 會員登入與客戶統計專題",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <head>
        {/* 預先連線，加快 CDN 載入 */}
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
        {/* Font Awesome 6 圖示庫 */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
