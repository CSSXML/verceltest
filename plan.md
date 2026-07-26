# 專題計畫書 — 會員登入 / 客戶資料統計系統

## 1. 專案目標

一個部署於 **Vercel** 的 Node.js 網站，功能包含：

1. 首頁登入：以 `account` 或 `mail` + `password` 登入，需通過六碼圖形驗證碼。
2. 登入後導向 `/showdata`：需登入才能瀏覽，顯示 `customer` 全部資料並做統計與圖表。
3. `admin` 角色額外顯示「管理」按鈕，進入 `/admin` 對所有會員做 CRUD。
4. 密碼使用資料庫 `pgcrypto` 擴充（bcrypt / `gen_salt('bf')`）加密。
5. 所有連線參數、金鑰皆走環境變數（`.env` / Vercel 環境變數）。

---

## 2. 技術選型

| 項目 | 選擇 | 說明 |
|------|------|------|
| 框架 | **Next.js 14 (App Router) + TypeScript** | 前端頁面與 API Routes 一體，Vercel 原生支援 |
| 資料庫 | **PostgreSQL (Supabase)** | `.env` 已含 `POSTGRES_*` 連線字串 |
| DB 驅動 | **`pg` (node-postgres)** | 直接下 SQL，使用連線池 |
| 密碼加密 | **`pgcrypto`** `crypt()` + `gen_salt('bf')` | 加密與驗證都在 DB 端完成 |
| 登入狀態 | **JWT + HttpOnly Cookie** | 無狀態，適合 serverless；用 `jose` 簽發/驗證 |
| 驗證碼 | 伺服器端產生 6 碼（2 小寫字母 + 4 數字）→ SVG 圖 | 用 `svg-captcha` 或自繪 SVG，答案存於短效簽章 cookie |
| 圖表 | **Chart.js** (`react-chartjs-2`) | 於 `/showdata` 呈現統計圖 |
| 樣式 | Tailwind CSS 或原生 CSS | 視需求 |

> 註：`.env` 目前同時有 Supabase 與 `POSTGRES_*` 參數。連線一律走 `POSTGRES_URL`（pooler，適合 serverless），DDL/遷移用 `POSTGRES_URL_NON_POOLING`。

---

## 3. 資料庫存取

> 資料表（`customer`、`member`）、enum（`customer_mark`、`member_role`）與 `pgcrypto` 擴充已於 Supabase/Vercel 上建立完成，本專案不含 DDL/遷移，直接對既有資料表下 SQL。

### 3.1 密碼加密 / 驗證（pgcrypto，bcrypt）

新增會員（寫入時加密）：
```sql
INSERT INTO member (account, mail, password, role)
VALUES ($1, $2, crypt($3, gen_salt('bf')), $4);
```

登入驗證（DB 端比對，密碼不出 DB）：
```sql
SELECT id, account, mail, role
FROM member
WHERE (account = $1 OR mail = $1)
  AND password = crypt($2, password);
```

---

## 4. 路由與畫面設計

| 路徑 | 方法 | 權限 | 說明 |
|------|------|------|------|
| `/` | GET | 公開 | 登入頁（account/mail、password、驗證碼圖） |
| `/change-password` | GET | 登入 | 首次登入強制變更密碼頁 |
| `/api/change-password` | POST | 登入 | 驗證強度後更新密碼，並解除 must_change_password |
| `/api/captcha` | GET | 公開 | 產生 6 碼 SVG 驗證碼，答案存簽章 cookie |
| `/api/login` | POST | 公開 | 驗證碼 → 帳密 → 發 JWT cookie |
| `/api/logout` | POST | 登入 | 清除 cookie |
| `/showdata` | GET | 登入 | customer 資料表 + 統計 + 圖表；admin 另顯示「管理」鈕 |
| `/admin` | GET | admin | 會員清單與管理介面 |
| `/api/members` | GET/POST | admin | 列出 / 新增會員 |
| `/api/members/[id]` | PUT/DELETE | admin | 更新 / 刪除會員 |

存取控制：Next.js `middleware.ts` 驗證 JWT cookie；`/showdata` 需有效 token，`/admin` 與 `/api/members*` 另需 `role = admin`。

---

## 4.1 首次登入強制變更密碼

- `member` 表新增 `must_change_password BOOLEAN NOT NULL DEFAULT true`（見 `migration.sql`）。
- 登入成功後，該旗標寫入 JWT。為 `true` 時 middleware 會把 `/showdata`、`/admin` 一律導向 `/change-password`。
- 密碼規則：**至少 8 碼（含 8 碼），需同時包含大寫英文、小寫英文、數字**；另檢查兩次輸入一致、不可與原密碼相同。
- 變更成功後以 `crypt(…, gen_salt('bf'))` 寫回、`must_change_password` 設為 false，並重新簽發 session。
- 管理員於 `/admin` **新增**會員時該旗標為 true；後續**重設**密碼不觸發。

## 5. 驗證碼設計

- 格式：2 個小寫英文字母 + 4 個數字（例 `ab1234`），共 6 碼。
- 產生：`/api/captcha` 隨機產生字串 → 繪成 SVG → 明碼答案以 JWT 簽章後放入短效（如 5 分鐘）HttpOnly cookie。
- 驗證：登入時比對使用者輸入與 cookie 內簽章答案，不分大小寫（可設定），驗證後即失效。

---

## 6. /showdata 統計與圖表

從 `customer` 撈全部資料，計算並呈現：

- KPI 卡片：客戶總數、`input` 合計、`output` 合計、淨額（input − output）。
- 長條圖：各 `location` 的 input / output 加總。
- 圓餅圖：各 `mark` 分類的客戶佔比。
- 明細表格：完整 customer 列表。

統計可在 SQL 端 `GROUP BY` 完成，減少前端運算。

---

## 7. 專案結構（規劃）

```
verceltest/
├─ app/
│  ├─ page.tsx                 # 登入頁 /
│  ├─ showdata/page.tsx        # /showdata
│  ├─ admin/page.tsx           # /admin
│  └─ api/
│     ├─ captcha/route.ts
│     ├─ login/route.ts
│     ├─ logout/route.ts
│     └─ members/
│        ├─ route.ts           # GET 列表 / POST 新增
│        └─ [id]/route.ts      # PUT / DELETE
├─ lib/
│  ├─ db.ts                    # pg Pool（讀 POSTGRES_URL）
│  ├─ auth.ts                  # JWT 簽發 / 驗證（jose）
│  └─ captcha.ts               # 驗證碼產生
├─ middleware.ts               # 路由權限守衛
├─ .env                        # 本機（已在 .gitignore）
├─ .gitignore
└─ plan.md
```

---

## 8. 環境變數（.env / Vercel）

| 變數 | 用途 |
|------|------|
| `POSTGRES_URL` | 應用連線（pooler） |
| `JWT_SECRET` | 簽發登入 JWT（**需新增**） |
| `CAPTCHA_SECRET` | 簽發驗證碼答案 cookie（**需新增**，或共用 JWT_SECRET） |

> 部署前於 Vercel 專案 → Settings → Environment Variables 同步設定上述變數。程式內不得寫死任何連線字串或金鑰。

---

## 9. 開發步驟

1. 初始化 Next.js + TypeScript 專案，裝 `pg`、`jose`、`chart.js`、`react-chartjs-2`、驗證碼套件。
2. 建 `lib/db.ts` 連線池（讀 `POSTGRES_URL`），連上既有資料表。
3. 實作 `/api/captcha`（產圖 + 簽章 cookie）。
4. 實作登入頁 `/` 與 `/api/login`（驗證碼 → `crypt()` 比對 → 發 JWT cookie）。
5. 建 `middleware.ts` 保護 `/showdata`、`/admin`、`/api/members*`。
6. 實作 `/showdata`：SQL 統計 + Chart.js 圖表 + 明細表；admin 顯示「管理」鈕。
7. 實作 `/admin` 與 `/api/members*` 的會員 CRUD（僅 admin）。
8. `/api/logout` 清 cookie。
9. 本機測試（.env）→ push GitHub → Vercel 匯入 → 設定環境變數 → 部署。

---

## 10. 安全注意事項

- 密碼加解密全在 DB 端（`pgcrypto`），密碼永不以明文離開資料庫。
- 所有 SQL 使用參數化查詢（`$1, $2 …`）防注入。
- JWT 與驗證碼答案存 **HttpOnly + Secure + SameSite** cookie。
- `.env` 已被 `.gitignore` 排除，金鑰不進版控；正式金鑰只放 Vercel。
- **提醒**：目前 `.env` 內含真實 Supabase 密碼與 service role key，且已 push 到公開 GitHub repo 的風險 → 建議儘速於 Supabase 輪替（rotate）這些金鑰。

---

## 11. 待確認事項

- `customer_mark` 的實際 enum 值（圖表分類會用到，需對齊你在 Supabase 建好的定義）。
- 驗證碼英文是否需區分大小寫。
- `/admin` 新增會員時，`role` 是否允許指派 admin。
