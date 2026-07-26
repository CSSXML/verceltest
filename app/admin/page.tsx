import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import AdminClient from "./AdminClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  const meId = session?.uid ?? -1;
  return <AdminClient meId={meId} />;
}
