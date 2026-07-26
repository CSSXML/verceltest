import { SignJWT, jwtVerify, JWTPayload } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("環境變數 JWT_SECRET 未設定");
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  uid: number;
  account: string;
  role: "sales" | "admin";
}

export const SESSION_COOKIE = "session";

export async function signSession(payload: {
  uid: number;
  account: string;
  role: "sales" | "admin";
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}
