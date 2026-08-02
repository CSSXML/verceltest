import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import UpPdfClient from "./UpPdfClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UpPdfPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) redirect("/");
  if (session.mustChange) redirect("/change-password");
  if (session.role !== "admin") redirect("/showdata");
  return <UpPdfClient account={session.account} />;
}
