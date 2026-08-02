"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "homepage-visitor-counted";
let counterRequest: Promise<number> | null = null;

function requestVisitorCount(): Promise<number> {
  if (counterRequest) return counterRequest;

  const alreadyCounted = sessionStorage.getItem(SESSION_KEY) === "true";
  if (!alreadyCounted) sessionStorage.setItem(SESSION_KEY, "true");

  counterRequest = fetch("/api/counter", {
    method: alreadyCounted ? "GET" : "POST",
    cache: "no-store",
  })
    .then(async (response) => {
      if (!response.ok) throw new Error("visitor counter request failed");
      const data = (await response.json()) as { count: number };
      return data.count;
    })
    .catch((error) => {
      counterRequest = null;
      if (!alreadyCounted) sessionStorage.removeItem(SESSION_KEY);
      throw error;
    });

  return counterRequest;
}

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    requestVisitorCount()
      .then((visitorCount) => {
        if (!cancelled) setCount(visitorCount);
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="visitor-counter" aria-live="polite">
      <i className="fa-solid fa-users" aria-hidden="true" />
      <span>累計訪客人數</span>
      <strong>{count === null ? "--" : count.toLocaleString("zh-TW")}</strong>
    </div>
  );
}
