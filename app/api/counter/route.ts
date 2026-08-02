import { NextResponse } from "next/server";
import { query } from "../../../lib/db";

export const dynamic = "force-dynamic";

type CounterRow = {
  total_visits: string | number;
};

export async function GET() {
  try {
    const rows = await query<CounterRow>(
      `SELECT total_visits
       FROM public.visitor_counter
       WHERE counter_key = $1`,
      ["homepage"]
    );

    return NextResponse.json(
      { count: Number(rows[0]?.total_visits ?? 0) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to read visitor counter:", error);
    return NextResponse.json({ error: "無法讀取訪客人數" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const rows = await query<CounterRow>(
      `INSERT INTO public.visitor_counter (counter_key, total_visits)
       VALUES ($1, 1)
       ON CONFLICT (counter_key)
       DO UPDATE SET
         total_visits = visitor_counter.total_visits + 1,
         updated_at = NOW()
       RETURNING total_visits`,
      ["homepage"]
    );

    return NextResponse.json(
      { count: Number(rows[0].total_visits) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Failed to increment visitor counter:", error);
    return NextResponse.json({ error: "無法更新訪客人數" }, { status: 500 });
  }
}

