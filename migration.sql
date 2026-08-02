-- 首次登入強制改密碼：於既有 member 表新增欄位
-- 請在 Supabase SQL Editor 執行一次

ALTER TABLE member
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT true;

-- 既有帳號若不想被強迫改密碼，可解除（例如你自己的 admin 帳號）：
-- UPDATE member SET must_change_password = false WHERE account = '你的admin帳號';

-- 若希望所有既有帳號下次登入都改一次密碼，則保持預設 true 即可。
