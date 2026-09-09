-- v2: full state sync (likes, checkins, comments, edit logs, notifications) + richer steps/routes + user profile blob
ALTER TABLE steps ADD COLUMN image_keys TEXT;   -- JSON array of R2 object keys
ALTER TABLE steps ADD COLUMN extra_json TEXT;   -- category/emoji/subtitle/arrivalTime/stayDuration/transitType/distanceFromPrev/photoCaption/gps

ALTER TABLE routes ADD COLUMN tags_json TEXT;
ALTER TABLE routes ADD COLUMN creator_name TEXT;
ALTER TABLE routes ADD COLUMN creator_avatar TEXT;

ALTER TABLE users ADD COLUMN profile_json TEXT; -- equipped/owned cosmetics, challenge, invites, stickersEarned, completedRoutes

CREATE TABLE IF NOT EXISTS likes (
  route_id TEXT, user_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(route_id, user_id)
);
CREATE TABLE IF NOT EXISTS checkins (
  route_id TEXT, step_index INTEGER, user_id TEXT, user_name TEXT,
  checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY(route_id, step_index, user_id)
);
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY, route_id TEXT, user_id TEXT, user_name TEXT, avatar TEXT,
  text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS edit_logs (
  id TEXT PRIMARY KEY, route_id TEXT, user_id TEXT, user_name TEXT, avatar TEXT,
  action TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, user_id TEXT, creator TEXT, title TEXT, route_id TEXT,
  read INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
