import { Pool } from "pg";

// 全域重用連線池，避免 serverless 環境每次請求都建立新連線
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

/**
 * 注意：pg 在解析 connectionString 時，字串內的 `sslmode` 會覆蓋掉
 * 我們傳入的 ssl 物件（sslmode=require 會被當成 verify-full），
 * 導致 Supabase 的自簽憑證出現
 * "self-signed certificate in certificate chain" 錯誤。
 * 因此先把 sslmode 從連線字串移除，再自行指定 ssl 設定。
 */
function buildConnectionString(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

function getPool(): Pool {
  if (global._pgPool) return global._pgPool;

  const raw = process.env.POSTGRES_URL;
  if (!raw) {
    throw new Error("環境變數 POSTGRES_URL 未設定");
  }

  const pool = new Pool({
    connectionString: buildConnectionString(raw),
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

  global._pgPool = pool;
  return pool;
}

export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const res = await getPool().query(text, params);
  return res.rows as T[];
}
