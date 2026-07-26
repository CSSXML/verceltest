import { Pool } from "pg";

// 全域重用連線池，避免 serverless 環境每次請求都建立新連線
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const connectionString = process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("環境變數 POSTGRES_URL 未設定");
}

export const pool =
  global._pgPool ??
  new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const res = await pool.query(text, params);
  return res.rows as T[];
}
