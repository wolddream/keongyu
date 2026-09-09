import { json, uid } from "./util";

export async function handleToggleLike(request: Request, env: Env, routeId: string): Promise<Response> {
	const { user_id } = (await request.json()) as { user_id?: string };
	if (!user_id) return json({ error: "user_id is required" }, 400);

	const existing = await env.DB.prepare(`SELECT 1 FROM likes WHERE route_id = ? AND user_id = ?`).bind(routeId, user_id).first();
	if (existing) {
		await env.DB.batch([
			env.DB.prepare(`DELETE FROM likes WHERE route_id = ? AND user_id = ?`).bind(routeId, user_id),
			env.DB.prepare(`UPDATE routes SET likes = MAX(0, likes - 1) WHERE id = ?`).bind(routeId),
		]);
	} else {
		await env.DB.batch([
			env.DB.prepare(`INSERT INTO likes (route_id, user_id) VALUES (?, ?)`).bind(routeId, user_id),
			env.DB.prepare(`UPDATE routes SET likes = likes + 1 WHERE id = ?`).bind(routeId),
		]);
	}
	const row = await env.DB.prepare(`SELECT likes FROM routes WHERE id = ?`).bind(routeId).first<{ likes: number }>();
	return json({ liked: !existing, likes: row?.likes ?? 0 });
}

const CHECKIN_POINTS = 5;

// Toggles a GPS check-in for one step. Checking in awards points + drops a social-proof comment;
// tapping an already-checked-in step cancels it and claws the points back (mirrors the client-side
// gpsCheckInStep() toggle added for the same reason - stop check-in/cancel from farming points).
export async function handleToggleCheckin(request: Request, env: Env, routeId: string): Promise<Response> {
	const body = (await request.json()) as { user_id?: string; user_name?: string; step_index?: number };
	const { user_id, user_name, step_index } = body;
	if (!user_id || step_index === undefined) return json({ error: "user_id and step_index are required" }, 400);

	const existing = await env.DB.prepare(`SELECT 1 FROM checkins WHERE route_id = ? AND step_index = ? AND user_id = ?`)
		.bind(routeId, step_index, user_id)
		.first();

	if (existing) {
		await env.DB.batch([
			env.DB.prepare(`DELETE FROM checkins WHERE route_id = ? AND step_index = ? AND user_id = ?`).bind(routeId, step_index, user_id),
			env.DB.prepare(`UPDATE users SET points = MAX(0, points - ?) WHERE id = ?`).bind(CHECKIN_POINTS, user_id),
			env.DB.prepare(`INSERT INTO points_history (id, user_id, amount, reason) VALUES (?, ?, ?, ?)`).bind(
				uid("p"),
				user_id,
				-CHECKIN_POINTS,
				`GPS 인증 취소: 스텝 ${step_index + 1}`
			),
		]);
		return json({ checkedIn: false });
	}

	const name = user_name || user_id;
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO checkins (route_id, step_index, user_id, user_name) VALUES (?, ?, ?, ?)`).bind(routeId, step_index, user_id, name),
		env.DB.prepare(`INSERT INTO users (id, name, points, avatar) VALUES (?, ?, ?, '') ON CONFLICT(id) DO UPDATE SET points = points + ?`).bind(
			user_id,
			name,
			CHECKIN_POINTS,
			CHECKIN_POINTS
		),
		env.DB.prepare(`INSERT INTO points_history (id, user_id, amount, reason) VALUES (?, ?, ?, ?)`).bind(
			uid("p"),
			user_id,
			CHECKIN_POINTS,
			`GPS 인증: 스텝 ${step_index + 1}`
		),
		env.DB.prepare(`INSERT INTO comments (id, route_id, user_id, user_name, text) VALUES (?, ?, ?, ?, ?)`).bind(
			uid("cm"),
			routeId,
			user_id,
			name,
			`📍 [${name}] 스텝 ${step_index + 1} GPS 인증 완료! 발도장 꾹 ✨`
		),
	]);
	return json({ checkedIn: true });
}

export async function handleGetSubscriptions(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(`SELECT creator_id, notif_level FROM subscriptions WHERE user_id = ?`)
		.bind(userId)
		.all<{ creator_id: string; notif_level: string }>();
	const map: Record<string, { subscribed: boolean; notif: string }> = {};
	for (const row of results) map[row.creator_id] = { subscribed: true, notif: row.notif_level };
	return json({ subscriptions: map });
}

export async function handlePostSubscription(request: Request, env: Env): Promise<Response> {
	const { user_id, creator, notif = "all" } = (await request.json()) as { user_id?: string; creator?: string; notif?: string };
	if (!user_id || !creator) return json({ error: "user_id and creator are required" }, 400);
	await env.DB.prepare(
		`INSERT INTO subscriptions (user_id, creator_id, notif_level) VALUES (?, ?, ?)
		 ON CONFLICT(user_id, creator_id) DO UPDATE SET notif_level = excluded.notif_level`
	)
		.bind(user_id, creator, notif)
		.run();
	return json({ ok: true });
}

export async function handleDeleteSubscription(env: Env, userId: string, creator: string): Promise<Response> {
	await env.DB.prepare(`DELETE FROM subscriptions WHERE user_id = ? AND creator_id = ?`).bind(userId, creator).run();
	return json({ ok: true });
}

export async function handleGetNotifications(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, creator, title, route_id, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
	)
		.bind(userId)
		.all();
	return json({ notifications: results });
}

export async function handleMarkAllNotificationsRead(request: Request, env: Env): Promise<Response> {
	const { user_id } = (await request.json()) as { user_id?: string };
	if (!user_id) return json({ error: "user_id is required" }, 400);
	await env.DB.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).bind(user_id).run();
	return json({ ok: true });
}
