import { cookies } from "next/headers";
import { verifySession, SESSION_COOKIE, SessionPayload } from "@/lib/auth";

export async function requireAdmin(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session || session.role !== "admin" || session.mustChange) return null;
  return session;
}
