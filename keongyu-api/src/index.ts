/**
 * KEONGYU API Worker
 *
 * Endpoints:
 *   GET  /api/routes                 -> list routes from D1
 *   POST /api/routes                 -> create a route (+ optional image upload to R2, Turnstile-protected)
 *   POST /api/collab/join            -> add a participant to a route
 *   POST /api/chat                   -> insert a chat message (Turnstile-protected; DO broadcast: 5️⃣ 단계에서 연결)
 *   GET  /oauth/kakao/callback       -> Kakao OAuth redirect target (6️⃣ 인증 & 카카오)
 *   GET  /api/admin/verify           -> checks X-ADMIN-TOKEN header against env.ADMIN_TOKEN (admin.html auth gate)
 *
 * Bindings (wrangler.jsonc): DB (D1), IMAGES (R2)
 * Secrets (wrangler secret put): TURNSTILE_SECRET_KEY, KAKAO_REST_API_KEY, (optional) KAKAO_CLIENT_SECRET, ADMIN_TOKEN
 */

declare global {
	interface Env {
		TURNSTILE_SECRET_KEY: string;
		KAKAO_REST_API_KEY: string;
		KAKAO_CLIENT_SECRET?: string;
		ADMIN_TOKEN: string;
	}
}

// Constant-time string compare - avoids leaking ADMIN_TOKEN length/prefix via response timing.
function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBytes = enc.encode(a);
	const bBytes = enc.encode(b);
	if (aBytes.length !== bBytes.length) {
		// Still walk a same-length buffer so early-return doesn't itself leak length via timing.
		let dummy = 0;
		for (let i = 0; i < aBytes.length; i++) dummy |= aBytes[i] ^ (bBytes[i % (bBytes.length || 1)] || 0);
		return false;
	}
	let diff = 0;
	for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
	return diff === 0;
}

async function handleAdminVerify(request: Request, env: Env): Promise<Response> {
	const token = request.headers.get("X-ADMIN-TOKEN") || "";
	if (!token || !env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) {
		return json({ ok: false }, 401);
	}
	return json({ ok: true });
}

function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});
}

function cors(resp: Response): Response {
	resp.headers.set("Access-Control-Allow-Origin", "*");
	resp.headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
	resp.headers.set("Access-Control-Allow-Headers", "Content-Type, X-ADMIN-TOKEN");
	return resp;
}

function uid(prefix: string): string {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Verifies a Turnstile token (form field "cf-turnstile-response") against Cloudflare's siteverify API.
// Used to gate spam-prone write endpoints (route uploads, chat/comments) per the 8️⃣ 배포 & 모니터링 step.
async function verifyTurnstile(token: string | null | undefined, ip: string | null, secret: string): Promise<boolean> {
	if (!token) return false;
	const body = new URLSearchParams();
	body.set("secret", secret);
	body.set("response", token);
	if (ip) body.set("remoteip", ip);
	try {
		const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
			method: "POST",
			body,
		});
		const data = (await res.json()) as { success: boolean };
		return !!data.success;
	} catch {
		return false;
	}
}

// UTF-8 safe base64 (btoa() alone mangles multi-byte chars like Korean nicknames).
function toBase64Utf8(obj: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(obj));
	let binary = "";
	bytes.forEach((b) => (binary += String.fromCharCode(b)));
	return btoa(binary);
}

// Kakao OAuth (authorization code) redirect target. Kakao's JS SDK v2 dropped the popup-based
// Kakao.Auth.login(); the supported flow is now Kakao.Auth.authorize() (full-page redirect to
// Kakao) -> Kakao redirects back here with ?code=... -> we exchange it server-side (keeping any
// client secret off the client) -> redirect back to the frontend with the resulting profile in
// the URL hash, which index.html picks up on load.
//
// IMPORTANT: Kakao.Auth.authorize() on the frontend uses the JS key passed to Kakao.init() (see
// KAKAO_JS_KEY in index.html) as the authorization request's client_id - NOT the REST API key.
// The token exchange below MUST use that exact same client_id, or Kakao rejects it with
// invalid_client/"Bad client credentials" even though the REST API key itself is fine (found by
// live-testing with a real Kakao account - the two must match, they aren't interchangeable here).
const KAKAO_JS_KEY = "c9b3225b112c58a9bba266cfe150b50a"; // public key, safe to hardcode - matches index.html

async function handleKakaoCallback(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const errorParam = url.searchParams.get("error");
	const frontendOrigin = url.searchParams.get("state")
		? decodeURIComponent(url.searchParams.get("state") as string)
		: "https://keongyu.wolddream.workers.dev";
	const redirectUri = `${url.origin}/oauth/kakao/callback`;

	const fail = (reason: string, detail?: unknown) =>
		Response.redirect(`${frontendOrigin}/#kakao_login=${encodeURIComponent(toBase64Utf8({ error: reason, detail }))}`, 302);

	if (errorParam || !code) return fail(errorParam || "no_code");

	try {
		const tokenBody = new URLSearchParams({
			grant_type: "authorization_code",
			client_id: KAKAO_JS_KEY,
			redirect_uri: redirectUri,
			code,
		});
		if (env.KAKAO_CLIENT_SECRET) tokenBody.set("client_secret", env.KAKAO_CLIENT_SECRET);

		const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
			method: "POST",
			headers: { "content-type": "application/x-www-form-urlencoded;charset=utf-8" },
			body: tokenBody,
		});
		const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string; error_description?: string };
		if (!tokenData.access_token) {
			return fail("token_exchange_failed", { status: tokenRes.status, error: tokenData.error, description: tokenData.error_description });
		}

		const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
			headers: { Authorization: `Bearer ${tokenData.access_token}` },
		});
		const profile = (await profileRes.json()) as {
			id: number;
			kakao_account?: { email?: string; profile?: { nickname?: string; profile_image_url?: string } };
			properties?: { nickname?: string; profile_image?: string };
		};
		const account = profile.kakao_account || {};
		const p = account.profile || profile.properties || {};
		const payload = {
			id: profile.id,
			nickname: p.nickname || "카카오유저",
			email: account.email || null,
			profileImage: (p as { profile_image_url?: string; profile_image?: string }).profile_image_url || (p as { profile_image?: string }).profile_image || null,
		};
		return Response.redirect(`${frontendOrigin}/#kakao_login=${encodeURIComponent(toBase64Utf8(payload))}`, 302);
	} catch (err) {
		return fail("exchange_error", (err as Error).message);
	}
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
	let turnstileToken = "";

	if (contentType.includes("multipart/form-data")) {
		const form = await request.formData();
		title = String(form.get("title") || "");
		purpose = String(form.get("purpose") || "");
		distance = String(form.get("distance") || "");
		time = String(form.get("time") || "");
		budget = String(form.get("budget") || "");
		creatorId = String(form.get("creator_id") || "");
		turnstileToken = String(form.get("cf-turnstile-response") || "");
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
		turnstileToken = body["cf-turnstile-response"] || "";
	}

	if (!title || !creatorId) {
		return json({ error: "title and creator_id are required" }, 400);
	}

	const humanVerified = await verifyTurnstile(turnstileToken, request.headers.get("CF-Connecting-IP"), env.TURNSTILE_SECRET_KEY);
	if (!humanVerified) {
		return json({ error: "Turnstile verification failed" }, 403);
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
		"cf-turnstile-response"?: string;
	};
	const { route_id, step_index = 0, user_id, user_name, avatar = "", text, type = "text" } = body;
	if (!route_id || !user_id || !text) {
		return json({ error: "route_id, user_id and text are required" }, 400);
	}

	const humanVerified = await verifyTurnstile(body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP"), env.TURNSTILE_SECRET_KEY);
	if (!humanVerified) {
		return json({ error: "Turnstile verification failed" }, 403);
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
			if (url.pathname === "/oauth/kakao/callback" && request.method === "GET") {
				return handleKakaoCallback(request, env); // full-page redirect, no CORS needed
			}
			if (url.pathname === "/api/admin/verify" && request.method === "GET") {
				return cors(await handleAdminVerify(request, env));
			}
		} catch (err) {
			return cors(json({ error: (err as Error).message }, 500));
		}

		return cors(new Response("Not found", { status: 404 }));
	},
} satisfies ExportedHandler<Env>;
