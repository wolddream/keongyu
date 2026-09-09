import { json, uid } from "./util";

export async function handleGetChat(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const routeId = url.searchParams.get("route_id");
	const stepIndex = url.searchParams.get("step_index");
	if (!routeId) return json({ error: "route_id is required" }, 400);

	const query = stepIndex !== null
		? env.DB.prepare(
				`SELECT id, route_id, step_index, user_id, user_name, avatar, text, type, created_at
				 FROM chats WHERE route_id = ? AND step_index = ? ORDER BY created_at ASC LIMIT 200`
			).bind(routeId, Number(stepIndex))
		: env.DB.prepare(
				`SELECT id, route_id, step_index, user_id, user_name, avatar, text, type, created_at
				 FROM chats WHERE route_id = ? ORDER BY created_at ASC LIMIT 200`
			).bind(routeId);

	const { results } = await query.all();
	return json({ messages: results });
}

export async function handleChat(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as {
		route_id?: string;
		step_index?: number;
		user_id?: string;
		user_name?: string;
		avatar?: string;
		text?: string;
		type?: string;
	};
	const { route_id, step_index = 0, user_id, user_name, avatar = "", text, type = "text" } = body;
	if (!route_id || !user_id || !text) {
		return json({ error: "route_id, user_id and text are required" }, 400);
	}

	// Turnstile 검증은 사용자 요청으로 중단 (프론트 위젯도 함께 제거됨).
	void env.TURNSTILE_SECRET_KEY;

	const id = uid("c");
	await env.DB.prepare(
		`INSERT INTO chats (id, route_id, step_index, user_id, user_name, avatar, text, type)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(id, route_id, step_index, user_id, user_name || user_id, avatar, text, type)
		.run();

	// TODO(5️⃣ Durable Objects): broadcast this message to the route's ChatRoom WebSocket clients.

	return json({ id }, 201);
}
