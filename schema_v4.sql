-- v4: PortOne 결제(별사탕 충전) 검증 기록 - payment_id를 PK로 둬서 같은 결제를 두 번 크레딧하지 않게 함
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,          -- PortOne payment id
  user_id TEXT NOT NULL,
  pack_amount INTEGER NOT NULL, -- 지급된 별사탕 개수
  paid_won INTEGER NOT NULL,    -- PortOne이 검증한 실제 결제 금액(원)
  status TEXT NOT NULL DEFAULT 'verified',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
