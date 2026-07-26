import { SignJWT, jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("環境變數 JWT_SECRET 未設定");
}
const secretKey = new TextEncoder().encode(JWT_SECRET);

export interface SessionPayload extends JWTPayload {
  uid: number;
  account: string;
  role: "sales" | "admin";
}

const COOKIE_NAME = "session";

export async function signSession(payload: {
  uid: number;
  account: string;
  role: "sales" | "admin";
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey);
}

export async function verifySession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE_NAME;
