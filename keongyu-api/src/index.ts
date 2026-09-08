/**
 * KEONGYU API Worker
 *
 * Endpoints:
 *   GET  /api/routes           -> list routes from D1
 *   POST /api/routes           -> create a route (+ optional image upload to R2)
 *   POST /api/collab/join      -> add a participant to a route
 *   POST /api/chat             -> insert a chat message (Durable Object broadcast: 5️⃣ 단계에서 연결)
 *
 * Bindings (wrangler.jsonc): DB (D1), IMAGES (R2)
 */

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});
}

function cors(resp: Response): Response {
	resp.headers.set("Access-Control-Allow-Origin", "*");
	resp.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	resp.headers.set("Access-Control-Allow-Headers", "Content-Type");
	return resp;
}

function uid(prefix: string): string {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function handleGetRoutes(env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, creator_id, title, purpose, distance, time, budget, likes,
		        is_public, is_collaborative, image_url, created_at
		 FROM routes ORDER BY created_at DESC LIMIT 100`
	).all();
	return json({ routes: results });
}

async function handlePostRoutes(request: Request, env: Env): Promise<Response> {
	const contentType = request.headers.get("content-type") || "";
	let title = "";
	let purpose = "";
	let distance = "";
	let time = "";
	let budget = "";
	let creatorId = "";
	let imageFile: File | null = null;

	if (contentType.includes("multipart/form-data")) {
		const form = await request.formData();
		title = String(form.get("title") || "");
		purpose = String(form.get("purpose") || "");
		distance = String(form.get("distance") || "");
		time = String(form.get("time") || "");
		budget = String(form.get("budget") || "");
		creatorId = String(form.get("creator_id") || "");
		const f = form.get("image");
		if (f instanceof File) imageFile = f;
	} else {
		const body = (await request.json()) as Record<string, string>;
		title = body.title || "";
		purpose = body.purpose || "";
		distance = body.distance || "";
		time = body.time || "";
		budget = body.budget || "";
		creatorId = body.creator_id || "";
	}

	if (!title || !creatorId) {
		return json({ error: "title and creator_id are required" }, 400);
	}

	let imageUrl: string | null = null;
	if (imageFile) {
		const key = `routes/${uid("img")}-${imageFile.name}`;
		await env.IMAGES.put(key, await imageFile.arrayBuffer(), {
			httpMetadata: { contentType: imageFile.type || "application/octet-stream" },
		});
		imageUrl = key; // R2 public base URL prefix is applied on the frontend/env config
	}

	const id = uid("r");
	await env.DB.prepare(
		`INSERT INTO routes (id, creator_id, title, purpose, distance, time, budget, likes, is_public, is_collaborative, image_url)
		 VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, 0, ?)`
	)
		.bind(id, creatorId, title, purpose, distance, time, budget, imageUrl)
		.run();

	return json({ id, image_url: imageUrl }, 201);
}

async function handleCollabJoin(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as { route_id?: string; user_id?: string; role?: string };
	const { route_id, user_id, role = "editor" } = body;
	if (!route_id || !user_id) {
		return json({ error: "route_id and user_id are required" }, 400);
	}

	await env.DB.prepare(
		`INSERT INTO participants (route_id, user_id, role, joined_at)
		 VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		 ON CONFLICT(route_id, user_id) DO UPDATE SET role = excluded.role`
	)
		.bind(route_id, user_id, role)
		.run();

	await env.DB.prepare(`UPDATE routes SET is_collaborative = 1 WHERE id = ?`).bind(route_id).run();

	return json({ ok: true });
}

async function handleChat(request: Request, env: Env): Promise<Response> {
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

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === "OPTIONS") {
			return cors(new Response(null, { status: 204 }));
		}

		const url = new URL(request.url);

		try {
			if (url.pathname === "/api/routes" && request.method === "GET") {
				return cors(await handleGetRoutes(env));
			}
			if (url.pathname === "/api/routes" && request.method === "POST") {
				return cors(await handlePostRoutes(request, env));
			}
			if (url.pathname === "/api/collab/join" && request.method === "POST") {
				return cors(await handleCollabJoin(request, env));
			}
			if (url.pathname === "/api/chat" && request.method === "POST") {
				return cors(await handleChat(request, env));
			}
		} catch (err) {
			return cors(json({ error: (err as Error).message }, 500));
		}

		return cors(new Response("Not found", { status: 404 }));
	},
} satisfies ExportedHandler<Env>;
