-- 별사탕(포인트) 선물하기. 화폐는 기존 users.points를 그대로 쓰고(새 화폐 테이블 없음),
-- 하루 선물 한도 추적용 컬럼만 users에 추가한다.
ALTER TABLE users ADD COLUMN daily_gift_sent INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN last_gift_date TEXT;

-- 선물 내역이자 "받은 선물함" 조회 대상 - 별도 inbox 테이블 없이 to_user_id로 바로 조회한다.
CREATE TABLE IF NOT EXISTS candy_gifts (
  id TEXT PRIMARY KEY,
  from_user_id TEXT NOT NULL,
  from_user_name TEXT,
  to_user_id TEXT NOT NULL,
  to_user_name TEXT,
  amount INTEGER NOT NULL,
  message TEXT,
  route_id TEXT,
  is_reply_bonus INTEGER DEFAULT 0,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_candy_gifts_to_user ON candy_gifts(to_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_candy_gifts_from_to ON candy_gifts(from_user_id, to_user_id, created_at);

-- 알림 시스템이 지금까지 "새 루트 알림" 한 종류만 다뤄왔어서(하드코딩된 type), 선물 도착
-- 알림도 같은 테이블/엔드포인트로 처리하려면 종류 구분 + 본문 컬럼이 필요하다.
ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'new_route';
ALTER TABLE notifications ADD COLUMN body TEXT;
