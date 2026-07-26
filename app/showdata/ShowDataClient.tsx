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
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

    // 依 location 加總
    const byLoc: Record<string, { input: number; output: number }> = {};
    for (const c of customers) {
      byLoc[c.location] ??= { input: 0, output: 0 };
      byLoc[c.location].input += c.input;
      byLoc[c.location].output += c.output;
    }

    // 依 mark 計數
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
      },
      {
        label: "Output",
        data: locLabels.map((l) => stats.byLoc[l].output),
        backgroundColor: "#f59e0b",
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
          "#dc2626",
          "#059669",
          "#7c3aed",
          "#d97706",
          "#0891b2",
        ],
      },
    ],
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="container">
      <div className="topbar">
        <h2>客戶資料統計　<span style={{ fontSize: 14, color: "#64748b" }}>Hi, {account}</span></h2>
        <div className="actions">
          {isAdmin && (
            <button className="btn" onClick={() => router.push("/admin")}>
              管理
            </button>
          )}
          <button className="btn secondary" onClick={handleLogout}>
            登出
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <div className="label">客戶總數</div>
          <div className="value">{customers.length}</div>
        </div>
        <div className="kpi">
          <div className="label">Input 合計</div>
          <div className="value">{fmt(stats.totalInput)}</div>
        </div>
        <div className="kpi">
          <div className="label">Output 合計</div>
          <div className="value">{fmt(stats.totalOutput)}</div>
        </div>
        <div className="kpi">
          <div className="label">淨額 (Input − Output)</div>
          <div className="value">{fmt(stats.totalInput - stats.totalOutput)}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="chart-box">
          <h3>各地區 Input / Output</h3>
          <Bar
            data={barData}
            options={{ responsive: true, plugins: { legend: { position: "top" } } }}
          />
        </div>
        <div className="chart-box">
          <h3>客戶分類 (mark) 佔比</h3>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>

      <div className="chart-box">
        <h3>客戶明細</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>名稱</th>
              <th>地區</th>
              <th className="right">Input</th>
              <th className="right">Output</th>
              <th>分類</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.location}</td>
                <td className="right">{fmt(c.input)}</td>
                <td className="right">{fmt(c.output)}</td>
                <td><span className="badge">{c.mark}</span></td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", color: "#94a3b8" }}>
                  尚無客戶資料
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
