import { json, uid, timingSafeEqual } from "./util";

// Public, unauthenticated write: the client posts here purely as a best-effort diagnostic beacon
// whenever a steps-sync PUT fails (network error or non-2xx), so a sync failure leaves a trace
// server-side even though the fire-and-forget pattern never surfaces it to the user. Never throws
// back at the client - logging a failure must not itself fail loudly.
export async function handleLogSyncError(request: Request, env: Env): Promise<Response> {
	const body = (await request.json().catch(() => ({}))) as {
		route_id?: string;
		user_id?: string;
		action?: string;
		phase?: string;
		detail?: string;
	};
	if (!body.route_id || !body.phase) return json({ ok: false }, 400);
	await env.DB.prepare(`INSERT INTO sync_errors (id, route_id, user_id, action, phase, detail) VALUES (?, ?, ?, ?, ?, ?)`)
		.bind(uid("synerr"), body.route_id, body.user_id || null, body.action || null, body.phase, (body.detail || "").slice(0, 500))
		.run();
	return json({ ok: true });
}

function requireAdmin(request: Request, env: Env): Response | null {
	const token = request.headers.get("X-ADMIN-TOKEN") || "";
	if (!token || !env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) {
		return json({ error: "unauthorized" }, 401);
	}
	return null;
}

export async function handleGetSyncErrors(request: Request, env: Env): Promise<Response> {
	const denied = requireAdmin(request, env);
	if (denied) return denied;
	const { results } = await env.DB.prepare(
		`SELECT id, route_id, user_id, action, phase, detail, created_at FROM sync_errors ORDER BY created_at DESC LIMIT 200`
	).all();
	return json({ errors: results });
}
