"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";
import CountUp from "../CountUp";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface Customer {
  id: number;
  name: string;
  location: string;
  input: number;
  output: number;
  mark: string;
}

const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function ShowDataClient({
  customers,
  isAdmin,
  account,
}: {
  customers: Customer[];
  isAdmin: boolean;
  account: string;
}) {
  const router = useRouter();

  const stats = useMemo(() => {
    const totalInput = customers.reduce((s, c) => s + c.input, 0);
    const totalOutput = customers.reduce((s, c) => s + c.output, 0);

    const byLoc: Record<string, { input: number; output: number }> = {};
    for (const c of customers) {
      byLoc[c.location] ??= { input: 0, output: 0 };
      byLoc[c.location].input += c.input;
      byLoc[c.location].output += c.output;
    }

    const byMark: Record<string, number> = {};
    for (const c of customers) {
      byMark[c.mark] = (byMark[c.mark] || 0) + 1;
    }

    return { totalInput, totalOutput, byLoc, byMark };
  }, [customers]);

  const locLabels = Object.keys(stats.byLoc);
  const barData = {
    labels: locLabels,
    datasets: [
      {
        label: "Input",
        data: locLabels.map((l) => stats.byLoc[l].input),
        backgroundColor: "#2563eb",
        borderRadius: 5,
        maxBarThickness: 42,
      },
      {
        label: "Output",
        data: locLabels.map((l) => stats.byLoc[l].output),
        backgroundColor: "#f59e0b",
        borderRadius: 5,
        maxBarThickness: 42,
      },
    ],
  };

  const markLabels = Object.keys(stats.byMark);
  const pieData = {
    labels: markLabels,
    datasets: [
      {
        data: markLabels.map((m) => stats.byMark[m]),
        backgroundColor: [
          "#2563eb",
          "#f59e0b",
          "#059669",
          "#7c3aed",
          "#dc2626",
          "#0891b2",
        ],
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const net = stats.totalInput - stats.totalOutput;

  return (
    <div className="container">
      <div className="topbar">
        <h2>
          <i className="fa-solid fa-chart-line" />
          客戶資料統計
          <span className="who">
            <i className="fa-solid fa-circle-user" />
            {account}
            {isAdmin && <span className="badge admin">admin</span>}
          </span>
        </h2>
        <div className="actions">
          {isAdmin && (
            <>
              <button className="btn" onClick={() => router.push("/admin")}>
                <i className="fa-solid fa-users-gear" />
                管理
              </button>
              <button className="btn" onClick={() => router.push("/up_photo")}>
                <i className="fa-solid fa-image" />
                圖片上傳
              </button>
            </>
          )}
          <button className="btn secondary" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket" />
            登出
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi reveal" style={{ animationDelay: "60ms" }}>
          <div className="icon" style={{ animationDelay: "160ms" }}>
            <i className="fa-solid fa-users" />
          </div>
          <div>
            <div className="label">客戶總數</div>
            <div className="value">
              <CountUp value={customers.length} delay={160} />
            </div>
          </div>
        </div>
        <div className="kpi k-in reveal" style={{ animationDelay: "140ms" }}>
          <div className="icon" style={{ animationDelay: "240ms" }}>
            <i className="fa-solid fa-arrow-trend-up" />
          </div>
          <div>
            <div className="label">INPUT 合計</div>
            <div className="value">
              <CountUp value={stats.totalInput} decimals={2} delay={240} />
            </div>
          </div>
        </div>
        <div className="kpi k-out reveal" style={{ animationDelay: "220ms" }}>
          <div className="icon" style={{ animationDelay: "320ms" }}>
            <i className="fa-solid fa-arrow-trend-down" />
          </div>
          <div>
            <div className="label">OUTPUT 合計</div>
            <div className="value">
              <CountUp value={stats.totalOutput} decimals={2} delay={320} />
            </div>
          </div>
        </div>
        <div className="kpi k-net reveal" style={{ animationDelay: "300ms" }}>
          <div className="icon" style={{ animationDelay: "400ms" }}>
            <i className="fa-solid fa-scale-balanced" />
          </div>
          <div>
            <div className="label">淨額 (IN − OUT)</div>
            <div
              className="value"
              style={{ color: net < 0 ? "#dc2626" : undefined }}
            >
              <CountUp value={net} decimals={2} delay={400} />
            </div>
          </div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-box reveal" style={{ animationDelay: "380ms" }}>
          <h3>
            <i className="fa-solid fa-chart-column" />
            各地區 Input / Output
          </h3>
          <Bar
            data={barData}
            options={{
              responsive: true,
              // 長條由下往上長出，並依序延遲
              animation: {
                duration: 900,
                easing: "easeOutQuart",
                delay: (ctx) =>
                  ctx.type === "data" && ctx.mode === "default"
                    ? 480 + ctx.dataIndex * 70 + ctx.datasetIndex * 35
                    : 0,
              },
              plugins: {
                legend: { position: "top", labels: { usePointStyle: true, boxWidth: 8 } },
              },
              scales: {
                y: { beginAtZero: true, grid: { color: "#eef2f6" } },
                x: { grid: { display: false } },
              },
            }}
          />
        </div>
        <div className="chart-box reveal" style={{ animationDelay: "460ms" }}>
          <h3>
            <i className="fa-solid fa-chart-pie" />
            客戶分類佔比
          </h3>
          <Pie
            data={pieData}
            options={{
              responsive: true,
              // 圓餅旋轉並放大展開
              animation: {
                duration: 1000,
                easing: "easeOutQuart",
                animateRotate: true,
                animateScale: true,
              },
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { usePointStyle: true, boxWidth: 8, padding: 14 },
                },
              },
            }}
          />
        </div>
      </div>

      <div className="table-card reveal" style={{ animationDelay: "540ms" }}>
        <h3>
          <i className="fa-solid fa-table-list" />
          客戶明細
          <span className="badge" style={{ marginLeft: "auto" }}>
            共 {customers.length} 筆
          </span>
        </h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th><i className="fa-solid fa-hashtag" />ID</th>
                <th><i className="fa-solid fa-building" />名稱</th>
                <th><i className="fa-solid fa-location-dot" />地區</th>
                <th className="right"><i className="fa-solid fa-arrow-down" />Input</th>
                <th className="right"><i className="fa-solid fa-arrow-up" />Output</th>
                <th><i className="fa-solid fa-tag" />分類</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr
                  key={c.id}
                  className="row-in"
                  style={{ animationDelay: `${620 + Math.min(i, 24) * 32}ms` }}
                >
                  <td>{c.id}</td>
                  <td>{c.name}</td>
                  <td>{c.location}</td>
                  <td className="right">{fmt(c.input)}</td>
                  <td className="right">{fmt(c.output)}</td>
                  <td>
                    <span className="badge">{c.mark}</span>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-row">
                    <i className="fa-regular fa-folder-open" />
                    尚無客戶資料
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
