-- 경유지 저장(steps PUT)이 fire-and-forget이라 실패해도 사용자에게 보이지 않던 문제 대응.
-- 클라이언트가 실패를 감지하면 이 테이블에 조용히 기록해, 콘솔 로그 없이도(사용자 스크린샷에
-- 의존하지 않고) 관리자 쪽에서 재발 여부를 확인할 수 있게 한다.
CREATE TABLE IF NOT EXISTS sync_errors (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT,
  phase TEXT NOT NULL,
  detail TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sync_errors_created ON sync_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_sync_errors_route ON sync_errors(route_id, created_at);
