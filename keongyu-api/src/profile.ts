import { json, uid, safeJsonParse } from "./util";

interface UserRow {
	id: string;
	name: string;
	points: number;
	avatar: string;
	profile_json: string | null;
}

export async function handleGetUser(env: Env, userId: string): Promise<Response> {
	const row = await env.DB.prepare(`SELECT id, name, points, avatar, profile_json FROM users WHERE id = ?`).bind(userId).first<UserRow>();
	if (!row) return json({ id: userId, name: null, points: 0, avatar: null, profile: {} });
	return json({ id: row.id, name: row.name, points: row.points, avatar: row.avatar, profile: safeJsonParse(row.profile_json, {}) });
}

// profile is a full replace (client sends its whole custom/challenge/invites/etc bundle each time)
// rather than a partial merge - simpler and avoids server-side merge-order bugs for a blob nothing
// else reads structurally.
export async function handlePatchUser(request: Request, env: Env, userId: string): Promise<Response> {
	const body = (await request.json()) as {
		name?: string;
		avatar?: string;
		profile?: unknown;
		points_delta?: number;
		points_reason?: string;
	};

	await env.DB.prepare(
		`INSERT INTO users (id, name, points, avatar) VALUES (?, ?, 0, ?)
		 ON CONFLICT(id) DO UPDATE SET
		   name = COALESCE(excluded.name, name),
		   avatar = COALESCE(excluded.avatar, avatar)`
	)
		.bind(userId, body.name ?? null, body.avatar ?? null)
		.run();

	const statements = [];
	if (body.profile !== undefined) {
		statements.push(env.DB.prepare(`UPDATE users SET profile_json = ? WHERE id = ?`).bind(JSON.stringify(body.profile), userId));
	}
	if (body.points_delta) {
		statements.push(env.DB.prepare(`UPDATE users SET points = MAX(0, points + ?) WHERE id = ?`).bind(body.points_delta, userId));
		statements.push(
			env.DB.prepare(`INSERT INTO points_history (id, user_id, amount, reason) VALUES (?, ?, ?, ?)`).bind(
				uid("p"),
				userId,
				body.points_delta,
				body.points_reason || "포인트 변경"
			)
		);
	}
	if (statements.length > 0) await env.DB.batch(statements);

	const row = await env.DB.prepare(`SELECT id, name, points, avatar, profile_json FROM users WHERE id = ?`).bind(userId).first<UserRow>();
	return json({ id: row!.id, name: row!.name, points: row!.points, avatar: row!.avatar, profile: safeJsonParse(row!.profile_json, {}) });
}
