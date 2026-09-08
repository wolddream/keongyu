CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, points INTEGER, avatar TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE routes (id TEXT PRIMARY KEY, creator_id TEXT, title TEXT, purpose TEXT, distance TEXT, time TEXT, budget TEXT, likes INTEGER DEFAULT 0, is_public INTEGER, is_collaborative INTEGER, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE steps (id TEXT PRIMARY KEY, route_id TEXT, step_order INTEGER, name TEXT, address TEXT, lat REAL, lng REAL, cost TEXT, memo TEXT, type TEXT);
CREATE TABLE participants (route_id TEXT, user_id TEXT, role TEXT, joined_at DATETIME, PRIMARY KEY(route_id, user_id));
CREATE TABLE chats (id TEXT PRIMARY KEY, route_id TEXT, step_index INTEGER, user_id TEXT, user_name TEXT, avatar TEXT, text TEXT, type TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE subscriptions (user_id TEXT, creator_id TEXT, notif_level TEXT, PRIMARY KEY(user_id, creator_id));
CREATE TABLE points_history (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
