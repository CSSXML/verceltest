import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import ChangePasswordClient from "./ChangePasswordClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  return <ChangePasswordClient account={session?.account ?? ""} />;
}
