export const PHOTO_BUCKET = "pic";
export const PHOTO_PAGE_SIZE = 8;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const SIGNED_URL_TTL_SEC = 60 * 60;

export const ALLOWED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function sanitizeOriginalName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "image";
  const cleaned = base.replace(/[^\w.\-]+/g, "_");
  return cleaned.slice(0, 120) || "image";
}

export function buildObjectPath(originalName: string, now = Date.now()): string {
  return `${now}-${sanitizeOriginalName(originalName)}`;
}

export function validatePhotoMeta(meta: {
  type: string;
  size: number;
  name: string;
}): string | null {
  if (!meta.name?.trim()) return "檔名無效";
  if (!ALLOWED_PHOTO_TYPES.has(meta.type)) {
    return "僅支援 jpg / png / webp / gif 格式";
  }
  if (meta.size <= 0) return "檔案為空";
  if (meta.size > MAX_PHOTO_BYTES) return "單檔不可超過 5MB";
  return null;
}
