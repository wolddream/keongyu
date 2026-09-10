-- v5: 사진 꾸미기(deco) - 풍경/음식 사진에 레이어 아이템을 올려 꾸미는 기능.
-- 아이템 카탈로그와 소유권은 서버가 관리한다 (기존 별사탕 상점처럼 클라이언트를 신뢰하지 않고,
-- 결제 검증과 같은 수준으로 구매를 D1 트랜잭션으로 처리하기 위함).

-- 아이템 카탈로그 (144개 시드 - seed_deco_items.sql)
CREATE TABLE IF NOT EXISTS deco_items (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,      -- 'landscape' | 'food'
  part TEXT NOT NULL,          -- z1..z12 레이어 단계 (아래 DECO_PARTS 참고)
  z_index INTEGER NOT NULL,    -- 1~12, 합성 시 그리는 순서
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,        -- 'N' | 'R' | 'SR' | 'SSR'
  price INTEGER NOT NULL,      -- 별사탕 가격
  emoji TEXT NOT NULL          -- 썸네일 겸 실제 레이어 렌더링(이미지 에셋 없이 이모지로 합성)
);

-- 사용자가 소유한 아이템 (구매 시 1회만 생성 - 같은 아이템 재구매 불가, 재장착은 무료로 반복 사용)
CREATE TABLE IF NOT EXISTS deco_inventory (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

-- 완성해서 저장한 꾸미기 결과물 (합성 PNG는 R2 IMAGES 버킷에 deco/<user_id>/<uid>.png로 저장)
CREATE TABLE IF NOT EXISTS deco_creations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  image_key TEXT NOT NULL,     -- R2 key, /api/images/:key로 서빙
  layers_json TEXT,            -- [{item_id, x, y, scale, rotation}] 스냅샷 - 나중에 재편집 대비
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_deco_items_category_part ON deco_items(category, part);
CREATE INDEX IF NOT EXISTS idx_deco_inventory_user ON deco_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_deco_creations_user ON deco_creations(user_id);
