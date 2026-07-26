import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import { query } from "@/lib/db";
import ShowDataClient from "./ShowDataClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Customer {
  id: number;
  name: string;
  location: string;
  input: number;
  output: number;
  mark: string;
}

export default async function ShowDataPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const isAdmin = session?.role === "admin";
  const account = session?.account ?? "";

  const rowsRaw = await query<any>(
    `SELECT id, name, location, input, output, mark FROM customer ORDER BY id`
  );
  const customers: Customer[] = rowsRaw.map((r) => ({
    id: r.id,
    name: r.name,
    location: r.location,
    input: Number(r.input),
    output: Number(r.output),
    mark: r.mark,
  }));

  return (
    <ShowDataClient
      customers={customers}
      isAdmin={isAdmin}
      account={account}
    />
  );
}
