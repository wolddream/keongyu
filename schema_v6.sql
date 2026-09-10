-- 루트카드 스킨(별사탕으로 꾸미기) - deco_items/deco_inventory와 동일한 패턴.
-- 장착 상태는 routes.skin_json(part -> item_id 맵)에 저장, 소유는 route_skin_inventory에 영구 기록.
ALTER TABLE routes ADD COLUMN skin_json TEXT;

CREATE TABLE IF NOT EXISTS route_skin_items (
  id TEXT PRIMARY KEY,
  part TEXT NOT NULL,       -- card_bg | map_style | route_line | pin_start | pin_via | pin_end |
                            -- title_badge | author_badge | weather_effect | frame | sticker | filter_aura
  name TEXT NOT NULL,
  rarity TEXT NOT NULL,     -- 'N' | 'R' | 'SR' | 'SSR'
  price INTEGER NOT NULL,   -- 별사탕 가격
  emoji TEXT NOT NULL       -- 썸네일 겸 렌더링 키(값은 index.html의 ROUTE_SKIN_RENDER가 해석)
);

CREATE TABLE IF NOT EXISTS route_skin_inventory (
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_route_skin_items_part ON route_skin_items(part);
CREATE INDEX IF NOT EXISTS idx_route_skin_inventory_user ON route_skin_inventory(user_id);
