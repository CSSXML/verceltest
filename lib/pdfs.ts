export const PDF_BUCKET = "pdf";
export const PDF_PAGE_SIZE = 20;
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const SIGNED_URL_TTL_SEC = 60 * 60;

export const ALLOWED_PDF_TYPES = new Set(["application/pdf"]);

export function sanitizeOriginalName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "document.pdf";
  const cleaned = base.replace(/[^\w.\-]+/g, "_");
  return cleaned.slice(0, 120) || "document.pdf";
}

export function buildObjectPath(originalName: string, now = Date.now()): string {
  return `${now}-${sanitizeOriginalName(originalName)}`;
}

export function validatePdfMeta(meta: {
  type: string;
  size: number;
  name: string;
}): string | null {
  if (!meta.name?.trim()) return "檔名無效";
  const lower = meta.name.toLowerCase();
  const typeOk =
    ALLOWED_PDF_TYPES.has(meta.type) ||
    meta.type === "" ||
    meta.type === "application/octet-stream";
  if (!typeOk || !lower.endsWith(".pdf")) {
    return "僅支援 PDF 格式";
  }
  if (meta.size <= 0) return "檔案為空";
  if (meta.size > MAX_PDF_BYTES) return "單檔不可超過 10MB";
  return null;
}
