import { Pool } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * 注意：pg 在解析 connectionString 時，字串內的 `sslmode` 會覆蓋掉
 * 我們傳入的 ssl 物件（sslmode=require 會被當成 verify-full），
 * 導致 Supabase 的自簽憑證出現
 * "self-signed certificate in certificate chain" 錯誤。
 * 因此先把 sslmode 從連線字串移除，再自行指定 ssl 設定。
 *
 * Cloudflare Workers 不能重用跨 request 的 TCP 連線池，
 * 生產環境走 Hyperdrive binding；本機 `next dev` fallback 到 POSTGRES_URL。
 */
function stripSslMode(raw: string): string {
  try {
    const url = new URL(raw);
    url.searchParams.delete("sslmode");
    return url.toString();
  } catch {
    return raw;
  }
}

type Conn = {
  connectionString: string;
  /** Hyperdrive 終端通常不需再自訂 ssl；直連 Supabase 本機開發才要 */
  ssl?: { rejectUnauthorized: boolean };
};

async function resolveConnection(): Promise<Conn> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const hd = (env as { HYPERDRIVE?: { connectionString: string } })
      .HYPERDRIVE;
    if (hd?.connectionString) {
      return { connectionString: hd.connectionString };
    }
  } catch {
    // 非 Workers runtime（例如 next dev / 單元測試）
  }

  const raw = process.env.POSTGRES_URL;
  if (!raw) {
    throw new Error("環境變數 POSTGRES_URL 未設定（或缺少 HYPERDRIVE binding）");
  }
  return {
    connectionString: stripSslMode(raw),
    ssl: { rejectUnauthorized: false },
  };
}

export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const conn = await resolveConnection();
  const pool = new Pool({
    connectionString: conn.connectionString,
    ...(conn.ssl ? { ssl: conn.ssl } : {}),
    // Workers：每 request 一條連線，用完即丟；由 Hyperdrive 負責真正的 pool
    max: 1,
    maxUses: 1,
    allowExitOnIdle: true,
  });

  try {
    const res = await pool.query(text, params);
    return res.rows as T[];
  } finally {
    await pool.end().catch(() => {});
  }
}
