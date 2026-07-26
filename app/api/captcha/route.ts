import { NextResponse } from "next/server";
import {
  generateCaptchaText,
  renderCaptchaSvg,
  signCaptcha,
  CAPTCHA_COOKIE,
} from "@/lib/captcha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const text = generateCaptchaText();
  const svg = renderCaptchaSvg(text);
  const token = await signCaptcha(text);

  const res = new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
  res.cookies.set(CAPTCHA_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
  return res;
}
