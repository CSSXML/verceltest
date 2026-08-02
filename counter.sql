-- 首頁訪客人數計數器
-- 請在 Supabase Dashboard 的 SQL Editor 執行此檔案。

CREATE TABLE IF NOT EXISTS public.visitor_counter (
  counter_key TEXT PRIMARY KEY,
  total_visits BIGINT NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.visitor_counter IS '網站各頁面的累計訪客人數';
COMMENT ON COLUMN public.visitor_counter.counter_key IS '計數器識別名稱，例如 homepage';
COMMENT ON COLUMN public.visitor_counter.total_visits IS '累計造訪次數';

INSERT INTO public.visitor_counter (counter_key, total_visits)
VALUES ('homepage', 0)
ON CONFLICT (counter_key) DO NOTHING;

