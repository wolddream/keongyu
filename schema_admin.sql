CREATE TABLE reports (id TEXT PRIMARY KEY, route_id TEXT, reason TEXT, reporter_id TEXT, status TEXT DEFAULT 'open', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE admin_logs (id TEXT PRIMARY KEY, admin_id TEXT, action TEXT, target_id TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
