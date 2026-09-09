import { json, timingSafeEqual, uid } from "./util";

export async function handleAdminVerify(request: Request, env: Env): Promise<Response> {
	const token = request.headers.get("X-ADMIN-TOKEN") || "";
	if (!token || !env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) {
		return json({ ok: false }, 401);
	}
	return json({ ok: true });
}

// handleAdminVerify above only *checks* a candidate token for the settings-tab UI - it doesn't
// gate anything by itself. Every other /api/admin/* route calls this first.
function requireAdmin(request: Request, env: Env): Response | null {
	const token = request.headers.get("X-ADMIN-TOKEN") || "";
	if (!token || !env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) {
		return json({ error: "unauthorized" }, 401);
	}
	return null;
}

// No per-admin accounts yet (one shared ADMIN_TOKEN) - admin_id is a fixed placeholder until
// real admin identities exist.
async function logAdminAction(env: Env, action: string, targetId: string): Promise<void> {
	await env.DB.prepare(`INSERT INTO admin_logs (id, admin_id, action, target_id) VALUES (?, 'admin', ?, ?)`).bind(uid("log"), action, targetId).run();
}

export async function handleGetReports(request: Request, env: Env): Promise<Response> {
	const denied = requireAdmin(request, env);
	if (denied) return denied;
	const status = new URL(request.url).searchParams.get("status") || "open";
	const stmt =
		status === "all"
			? env.DB.prepare(`SELECT id, route_id, reason, reporter_id, status, created_at FROM reports ORDER BY created_at DESC LIMIT 200`)
			: env.DB.prepare(`SELECT id, route_id, reason, reporter_id, status, created_at FROM reports WHERE status = ? ORDER BY created_at DESC LIMIT 200`).bind(
					status
			  );
	const { results } = await stmt.all();
	return json({ reports: results });
}

export async function handleResolveReport(request: Request, env: Env, reportId: string): Promise<Response> {
	const denied = requireAdmin(request, env);
	if (denied) return denied;
	const existing = await env.DB.prepare(`SELECT id FROM reports WHERE id = ?`).bind(reportId).first();
	if (!existing) return json({ error: "report not found" }, 404);
	await env.DB.prepare(`UPDATE reports SET status = 'resolved' WHERE id = ?`).bind(reportId).run();
	await logAdminAction(env, "resolve_report", reportId);
	return json({ ok: true });
}
