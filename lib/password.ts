export const PASSWORD_RULE =
  "密碼至少 8 碼，且需同時包含大寫英文、小寫英文與數字";

/**
 * 驗證密碼強度：8 碼以上（含 8 碼），需含大寫、小寫、數字
 * @returns 錯誤訊息；通過則回傳 null
 */
export function validatePassword(pw: string | undefined): string | null {
  if (!pw) return "請輸入密碼";
  if (pw.length < 8) return "密碼長度至少 8 碼";
  if (!/[A-Z]/.test(pw)) return "密碼需包含至少一個大寫英文字母";
  if (!/[a-z]/.test(pw)) return "密碼需包含至少一個小寫英文字母";
  if (!/[0-9]/.test(pw)) return "密碼需包含至少一個數字";
  return null;
}
