import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";
import UpPhotoClient from "./UpPhotoClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function UpPhotoPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) redirect("/");
  if (session.mustChange) redirect("/change-password");
  if (session.role !== "admin") redirect("/showdata");
  return <UpPhotoClient account={session.account} />;
}
