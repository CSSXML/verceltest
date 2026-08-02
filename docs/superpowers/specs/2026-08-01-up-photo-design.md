# Design: `/up_photo` — admin 圖片上傳（Supabase Storage）

Date: 2026-08-01  
Status: approved in chat; awaiting final review of this file

## Goal

Admin 可於管理導覽進入 `/up_photo`，從本機多選圖片上傳至 Supabase private bucket `pic`，並以分頁 gallery 瀏覽／刪除。

## Decisions

| 項目 | 選擇 |
|------|------|
| 權限 | 僅 `role === admin` |
| 上傳路徑 | Server API + `@supabase/supabase-js` service role |
| Bucket | `pic`，**private**；展示用 signed URL |
| 檔案規則 | 多選；`jpeg/png/webp/gif`；單檔 ≤ 5MB |
| 刪除 | Admin 可刪 |
| 分頁 | 每頁 8 張；超過 8 才顯示分頁控制 |

## Architecture

```
AdminClient topbar ──► /up_photo (client page)
                         │
                         ├─ POST /api/photos          (multipart upload)
                         ├─ GET  /api/photos?page=n   (list + signed URLs)
                         └─ DELETE /api/photos/[path] (remove object)

API routes ──► lib/supabase.ts (service-role client)
           ──► lib/auth session check (admin only)
           ──► Supabase Storage bucket `pic`
```

## Routes & middleware

- Page: `app/up_photo/page.tsx` + `UpPhotoClient.tsx`
- Protect in `middleware.ts`:
  - Add `/up_photo` to `PROTECTED` and `ADMIN_ONLY`
  - Extend `matcher` to include `/up_photo/:path*`
- API auth: same pattern as `/api/members` (JWT cookie + admin + not `mustChange`)

## Navigation

- `/admin` topbar: keep「返回統計」；新增「圖片上傳」→ `/up_photo`
- `/up_photo` topbar:「返回管理」→ `/admin`；「返回統計」→ `/showdata`

## Storage details

- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (already in `.env` / CF secrets)
- Object name: `{timestamp}-{sanitizedOriginalName}` (flat root of `pic`)
- Sanitize: strip path separators; allow alphanumerics, dash, underscore, dot
- List: `storage.from('pic').list('', { limit, offset, sortBy: { column: 'created_at', order: 'desc' } })`
- Signed URL TTL: 1 hour
- Delete: `storage.from('pic').remove([path])`；`path` URL-encoded in route param

## Upload validation

Client + server both enforce:

- MIME / extension ∈ `{image/jpeg, image/png, image/webp, image/gif}`
- Size ≤ 5 × 1024 × 1024 bytes
- Reject empty file list

Server returns `400` with clear error string on validation failure；`401/403` on auth failure.

## UI

1. Top: file picker +「上傳」button；顯示選取檔名／大小與錯誤
2. Below: responsive image grid（每頁最多 8）
3. Each tile: thumbnail (`signedUrl`), filename; delete icon with `confirm`
4. Pagination: 上一頁 / 頁碼 / 下一頁；`total ≤ 8` 時隱藏

Reuse existing `topbar` / `btn` / `container` styles from `globals.css`; add minimal grid/pagination classes only if needed.

## Out of scope

- Public bucket / CDN caching beyond signed URLs
- Folders / albums / captions
- Non-admin access
- Client-side direct-to-Storage upload
- Image compression / resize

## Prerequisites (manual)

- Supabase project already has private bucket named `pic`
- Service role key can read/write/delete that bucket (default service role can)

## Success criteria

- Admin can open `/up_photo` from admin nav; non-admin redirected to `/showdata`
- Multi-file upload lands in `pic` and appears in gallery after refresh/list
- Private objects load via signed URLs
- 9+ images paginate at 8 per page
- Delete removes object and updates gallery
