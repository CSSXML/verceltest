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
      <body>{children}</body>
    </html>
  );
}
