import { SignJWT, jwtVerify } from "jose";

function getSecretKey(): Uint8Array {
  const secret = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("環境變數 CAPTCHA_SECRET / JWT_SECRET 未設定");
  }
  return new TextEncoder().encode(secret);
}

export const CAPTCHA_COOKIE = "captcha";

// 產生 6 碼：2 個小寫英文字母 + 4 個數字，順序隨機打散
export function generateCaptchaText(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const chars = [
    letters[Math.floor(Math.random() * letters.length)],
    letters[Math.floor(Math.random() * letters.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
    digits[Math.floor(Math.random() * digits.length)],
  ];
  // Fisher–Yates 洗牌
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

// 把答案簽成短效 JWT（5 分鐘），放進 HttpOnly cookie
export async function signCaptcha(text: string): Promise<string> {
  return new SignJWT({ code: text.toLowerCase() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getSecretKey());
}

export async function verifyCaptcha(
  token: string | undefined,
  input: string | undefined
): Promise<boolean> {
  if (!token || !input) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return (payload as { code?: string }).code === input.trim().toLowerCase();
  } catch {
    return false;
  }
}

// 產生簡單的 SVG 驗證碼圖（含干擾線與抖動）
export function renderCaptchaSvg(text: string): string {
  const width = 150;
  const height = 44;
  const colors = ["#2563eb", "#dc2626", "#059669", "#7c3aed", "#d97706"];
  let glyphs = "";
  text.split("").forEach((ch, i) => {
    const x = 15 + i * 21 + (Math.random() * 4 - 2);
    const y = 30 + (Math.random() * 6 - 3);
    const rot = Math.floor(Math.random() * 30 - 15);
    const color = colors[Math.floor(Math.random() * colors.length)];
    glyphs += `<text x="${x}" y="${y}" font-size="24" font-family="monospace" font-weight="bold" fill="${color}" transform="rotate(${rot} ${x} ${y})">${ch}</text>`;
  });
  let lines = "";
  for (let i = 0; i < 4; i++) {
    const x1 = Math.random() * width;
    const y1 = Math.random() * height;
    const x2 = Math.random() * width;
    const y2 = Math.random() * height;
    const color = colors[Math.floor(Math.random() * colors.length)];
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1" opacity="0.5"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#f8fafc"/>${lines}${glyphs}</svg>`;
}
