"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 數字滾動計數動畫
 * 由 0 遞增至目標值，採 easeOutQuart 緩動（先快後慢）
 */
export default function CountUp({
  value,
  decimals = 0,
  duration = 1100,
  delay = 0,
}: {
  value: number;
  decimals?: number;
  duration?: number;
  delay?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 尊重使用者的「減少動態效果」系統偏好
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reduce || value === 0) {
      setDisplay(value);
      return;
    }

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 4); // easeOutQuart
        setDisplay(value * eased);
        if (p < 1) rafRef.current = requestAnimationFrame(tick);
        else setDisplay(value); // 收尾對齊精確值
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    if (delay > 0) timerRef.current = setTimeout(run, delay);
    else run();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, duration, delay]);

  return (
    <>
      {display.toLocaleString("en-US", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </>
  );
}
