import { json, uid, safeJsonParse } from "./util";

interface StepRow {
	id: string;
	route_id: string;
	step_order: number;
	name: string;
	address: string;
	cost: string;
	memo: string;
	type: string;
	image_keys: string | null;
	extra_json: string | null;
}

interface RouteRow {
	id: string;
	creator_id: string;
	creator_name: string | null;
	creator_avatar: string | null;
	title: string;
	purpose: string;
	distance: string;
	time: string;
	budget: string;
	likes: number;
	is_public: number;
	is_collaborative: number;
	image_url: string | null;
	tags_json: string | null;
	skin_json: string | null;
	created_at: string;
}

type StepExtra = {
	category?: string;
	emoji?: string;
	subtitle?: string;
	arrivalTime?: string;
	stayDuration?: string;
	transitType?: string | null;
	distanceFromPrev?: string;
	photoCaption?: string;
	gps?: unknown;
};

function stepRowToClient(row: StepRow) {
	const extra = safeJsonParse<StepExtra>(row.extra_json, {});
	return {
		type: row.type,
		name: row.name,
		address: row.address,
		cost: row.cost,
		memo: row.memo,
		images: safeJsonParse<string[]>(row.image_keys, []), // R2 keys - client resolves via /api/images/:key
		category: extra.category,
		emoji: extra.emoji,
		subtitle: extra.subtitle,
		arrivalTime: extra.arrivalTime,
		stayDuration: extra.stayDuration,
		transitType: extra.transitType ?? null,
		distanceFromPrev: extra.distanceFromPrev,
		photoCaption: extra.photoCaption,
		gps: extra.gps || null,
	};
}

function routeRowToClient(row: RouteRow, steps: ReturnType<typeof stepRowToClient>[]) {
	return {
		id: row.id,
		creator_id: row.creator_id,
		creator: row.creator_name || row.creator_id,
		creatorAvatar: row.creator_avatar || null,
		title: row.title,
		purpose: row.purpose,
		tags: safeJsonParse<string[]>(row.tags_json, []),
		distance: row.distance,
		time: row.time,
		budget: row.budget,
		likes: row.likes,
		isPublic: !!row.is_public,
		isCollaborative: !!row.is_collaborative,
		image: row.image_url || null, // R2 key - client resolves via /api/images/:key
		steps,
		skin: safeJsonParse<Record<string, string>>(row.skin_json, {}),
		createdAt: row.created_at,
	};
}

async function loadStepsByRouteIds(env: Env, routeIds: string[]): Promise<Map<string, StepRow[]>> {
	const byRoute = new Map<string, StepRow[]>();
	if (routeIds.length === 0) return byRoute;
	const placeholders = routeIds.map(() => "?").join(",");
	const { results } = await env.DB.prepare(
		`SELECT id, route_id, step_order, name, address, cost, memo, type, image_keys, extra_json
		 FROM steps WHERE route_id IN (${placeholders}) ORDER BY route_id, step_order`
	)
		.bind(...routeIds)
		.all<StepRow>();
	for (const row of results) {
		if (!byRoute.has(row.route_id)) byRoute.set(row.route_id, []);
		byRoute.get(row.route_id)!.push(row);
	}
	return byRoute;
}

export async function handleGetRoutes(env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, creator_id, creator_name, creator_avatar, title, purpose, distance, time, budget, likes,
		        is_public, is_collaborative, image_url, tags_json, skin_json, created_at
		 FROM routes ORDER BY created_at DESC LIMIT 100`
	).all<RouteRow>();

	const stepsByRoute = await loadStepsByRouteIds(env, results.map((r) => r.id));
	const routes = results.map((r) => routeRowToClient(r, (stepsByRoute.get(r.id) || []).map(stepRowToClient)));
	return json({ routes });
}

export async function handleGetRouteDetail(env: Env, routeId: string): Promise<Response> {
	const route = await env.DB.prepare(
		`SELECT id, creator_id, creator_name, creator_avatar, title, purpose, distance, time, budget, likes,
		        is_public, is_collaborative, image_url, tags_json, skin_json, created_at
		 FROM routes WHERE id = ?`
	)
		.bind(routeId)
		.first<RouteRow>();
	if (!route) return json({ error: "not found" }, 404);

	const stepsByRoute = await loadStepsByRouteIds(env, [routeId]);
	const [{ results: comments }, { results: editLog }] = await Promise.all([
		env.DB.prepare(`SELECT user_id, user_name, avatar, text, created_at FROM comments WHERE route_id = ? ORDER BY created_at DESC LIMIT 100`)
			.bind(routeId)
			.all(),
		env.DB.prepare(`SELECT user_id, user_name, avatar, action, created_at FROM edit_logs WHERE route_id = ? ORDER BY created_at DESC LIMIT 50`)
			.bind(routeId)
			.all(),
	]);

	return json({
		...routeRowToClient(route, (stepsByRoute.get(routeId) || []).map(stepRowToClient)),
		comments: comments.map((c: any) => ({ user: c.user_name, text: c.text })),
		editLog: editLog.map((l: any) => ({ user: l.user_name, avatar: l.avatar, action: l.action, time: l.created_at })),
	});
}

// Uploads every "step{i}_photo{j}" file field (j = 0..5) it finds to R2 and returns the keys,
// grouped by step index. Field naming matches how the client's FormData is built in index.html.
async function uploadStepPhotos(env: Env, form: FormData, routeId: string, stepCount: number): Promise<string[][]> {
	const imagesByStep: string[][] = [];
	for (let i = 0; i < stepCount; i++) {
		const keys: string[] = [];
		for (let j = 0; j < 6; j++) {
			const file = form.get(`step${i}_photo${j}`);
			if (!(file instanceof File)) continue;
			const key = `routes/${routeId}/step${i}/${uid("img")}`;
			await env.IMAGES.put(key, await file.arrayBuffer(), {
				httpMetadata: { contentType: file.type || "application/octet-stream" },
			});
			keys.push(key);
		}
		imagesByStep.push(keys);
	}
	return imagesByStep;
}

export async function handlePostRoutes(request: Request, env: Env): Promise<Response> {
	const contentType = request.headers.get("content-type") || "";
	if (!contentType.includes("multipart/form-data")) {
		return json({ error: "expected multipart/form-data" }, 400);
	}
	const form = await request.formData();

	const title = String(form.get("title") || "").trim();
	const purpose = String(form.get("purpose") || "");
	const distance = String(form.get("distance") || "");
	const time = String(form.get("time") || "");
	const budget = String(form.get("budget") || "");
	const creatorId = String(form.get("creator_id") || "");
	const creatorName = String(form.get("creator_name") || creatorId);
	const creatorAvatar = String(form.get("creator_avatar") || "");
	const tags = safeJsonParse<string[]>(String(form.get("tags") || ""), []);
	const isPublic = String(form.get("is_public") || "1") !== "0";
	const stepsMeta = safeJsonParse<Array<Record<string, unknown>>>(String(form.get("steps_meta") || ""), []);
	const skin = safeJsonParse<Record<string, string>>(String(form.get("skin_json") || ""), {});

	if (!title || !creatorId) {
		return json({ error: "title and creator_id are required" }, 400);
	}
	if (stepsMeta.length === 0) {
		return json({ error: "at least one step is required" }, 400);
	}

	const routeId = uid("r");
	const imagesByStep = await uploadStepPhotos(env, form, routeId, stepsMeta.length);
	const coverImage = imagesByStep.find((keys) => keys.length > 0)?.[0] || null;

	// Upsert the creator's users row without clobbering their existing points on repeat visits.
	await env.DB.prepare(
		`INSERT INTO users (id, name, points, avatar) VALUES (?, ?, 0, ?)
		 ON CONFLICT(id) DO UPDATE SET name = excluded.name, avatar = excluded.avatar`
	)
		.bind(creatorId, creatorName, creatorAvatar)
		.run();

	const routeInsert = env.DB.prepare(
		`INSERT INTO routes (id, creator_id, creator_name, creator_avatar, title, purpose, distance, time, budget,
		                      likes, is_public, is_collaborative, image_url, tags_json, skin_json)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?)`
	).bind(routeId, creatorId, creatorName, creatorAvatar, title, purpose, distance, time, budget, isPublic ? 1 : 0, coverImage, JSON.stringify(tags), JSON.stringify(skin));

	const stepInserts = stepsMeta.map((step, i) => {
		const gps = (step.gps as { lat?: number; lng?: number }) || null;
		const extra: StepExtra = {
			category: step.category as string | undefined,
			emoji: step.emoji as string | undefined,
			subtitle: step.subtitle as string | undefined,
			arrivalTime: step.arrivalTime as string | undefined,
			stayDuration: step.stayDuration as string | undefined,
			transitType: (step.transitType as string | null) ?? null,
			distanceFromPrev: step.distanceFromPrev as string | undefined,
			photoCaption: step.photoCaption as string | undefined,
			gps,
		};
		return env.DB.prepare(
			`INSERT INTO steps (id, route_id, step_order, name, address, lat, lng, cost, memo, type, image_keys, extra_json)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(
			uid("s"),
			routeId,
			i,
			String(step.name || ""),
			String(step.address || ""),
			gps?.lat ?? null,
			gps?.lng ?? null,
			String(step.cost || "0원"),
			String(step.memo || ""),
			String(step.type || "경유"),
			JSON.stringify(imagesByStep[i] || []),
			JSON.stringify(extra)
		);
	});

	await env.DB.batch([routeInsert, ...stepInserts]);

	// Fan out a notification to everyone subscribed to this creator (subscriptions are keyed by
	// creator display name on the client, so creator_id here means "creator identifier" = name).
	const { results: subscribers } = await env.DB.prepare(
		`SELECT user_id FROM subscriptions WHERE creator_id = ?`
	)
		.bind(creatorName)
		.all<{ user_id: string }>();
	if (subscribers.length > 0) {
		const notifInserts = subscribers
			.filter((s) => s.user_id !== creatorId)
			.map((s) =>
				env.DB.prepare(
					`INSERT INTO notifications (id, user_id, creator, title, route_id) VALUES (?, ?, ?, ?, ?)`
				).bind(uid("n"), s.user_id, creatorName, `${creatorName}님이 새 루트를 올렸어요: ${title}`, routeId)
			);
		if (notifInserts.length > 0) await env.DB.batch(notifInserts);
	}

	const steps = stepsMeta.map((step, i) =>
		stepRowToClient({
			id: "",
			route_id: routeId,
			step_order: i,
			name: String(step.name || ""),
			address: String(step.address || ""),
			cost: String(step.cost || "0원"),
			memo: String(step.memo || ""),
			type: String(step.type || "경유"),
			image_keys: JSON.stringify(imagesByStep[i] || []),
			extra_json: JSON.stringify({
				category: step.category,
				emoji: step.emoji,
				subtitle: step.subtitle,
				arrivalTime: step.arrivalTime,
				stayDuration: step.stayDuration,
				transitType: step.transitType ?? null,
				distanceFromPrev: step.distanceFromPrev,
				photoCaption: step.photoCaption,
				gps: step.gps || null,
			}),
		})
	);

	return json(
		routeRowToClient(
			{
				id: routeId,
				creator_id: creatorId,
				creator_name: creatorName,
				creator_avatar: creatorAvatar,
				title,
				purpose,
				distance,
				time,
				budget,
				likes: 0,
				is_public: isPublic ? 1 : 0,
				is_collaborative: 0,
				image_url: coverImage,
				tags_json: JSON.stringify(tags),
				created_at: new Date().toISOString(),
			},
			steps
		),
		201
	);
}

// Replaces a route's entire steps list in one shot (simpler and far less bug-prone than trying to
// keep step_order in sync via individual insert/update/delete calls) and records one edit_logs row
// describing what changed. Called after every local add/update/delete-step mutation on the client.
export async function handlePutRouteSteps(request: Request, env: Env, routeId: string): Promise<Response> {
	const body = (await request.json()) as {
		steps?: Array<Record<string, unknown>>;
		user_id?: string;
		user_name?: string;
		avatar?: string;
		action?: string;
	};
	const steps = body.steps || [];
	if (!Array.isArray(steps)) return json({ error: "steps must be an array" }, 400);

	const del = env.DB.prepare(`DELETE FROM steps WHERE route_id = ?`).bind(routeId);
	const inserts = steps.map((step, i) => {
		const gps = (step.gps as { lat?: number; lng?: number }) || null;
		const extra: StepExtra = {
			category: step.category as string | undefined,
			emoji: step.emoji as string | undefined,
			subtitle: step.subtitle as string | undefined,
			arrivalTime: step.arrivalTime as string | undefined,
			stayDuration: step.stayDuration as string | undefined,
			transitType: (step.transitType as string | null) ?? null,
			distanceFromPrev: step.distanceFromPrev as string | undefined,
			photoCaption: step.photoCaption as string | undefined,
			gps,
		};
		return env.DB.prepare(
			`INSERT INTO steps (id, route_id, step_order, name, address, lat, lng, cost, memo, type, image_keys, extra_json)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(
			uid("s"),
			routeId,
			i,
			String(step.name || ""),
			String(step.address || ""),
			gps?.lat ?? null,
			gps?.lng ?? null,
			String(step.cost || "0원"),
			String(step.memo || ""),
			String(step.type || "경유"),
			JSON.stringify((step.images as string[]) || []),
			JSON.stringify(extra)
		);
	});

	const statements = [del, ...inserts];
	if (body.action && body.user_id) {
		statements.push(
			env.DB.prepare(`INSERT INTO edit_logs (id, route_id, user_id, user_name, avatar, action) VALUES (?, ?, ?, ?, ?, ?)`).bind(
				uid("e"),
				routeId,
				body.user_id,
				body.user_name || body.user_id,
				body.avatar || "",
				body.action
			)
		);
	}
	await env.DB.batch(statements);

	return json({ ok: true });
}

// Updates route-level metadata only (title/purpose/distance/time/budget/tags/is_public) - steps
// go through PUT .../steps instead (see its comment for why that's a whole-array replace).
export async function handlePatchRoute(request: Request, env: Env, routeId: string): Promise<Response> {
	const body = (await request.json()) as {
		title?: string;
		purpose?: string;
		distance?: string;
		time?: string;
		budget?: string;
		tags?: string[];
		is_public?: boolean;
		skin?: Record<string, string>;
	};

	const sets: string[] = [];
	const values: unknown[] = [];
	if (body.title !== undefined) { sets.push("title = ?"); values.push(body.title); }
	if (body.purpose !== undefined) { sets.push("purpose = ?"); values.push(body.purpose); }
	if (body.distance !== undefined) { sets.push("distance = ?"); values.push(body.distance); }
	if (body.time !== undefined) { sets.push("time = ?"); values.push(body.time); }
	if (body.budget !== undefined) { sets.push("budget = ?"); values.push(body.budget); }
	if (body.tags !== undefined) { sets.push("tags_json = ?"); values.push(JSON.stringify(body.tags)); }
	if (body.is_public !== undefined) { sets.push("is_public = ?"); values.push(body.is_public ? 1 : 0); }
	if (body.skin !== undefined) { sets.push("skin_json = ?"); values.push(JSON.stringify(body.skin)); }

	if (sets.length === 0) return json({ error: "no fields to update" }, 400);

	values.push(routeId);
	await env.DB.prepare(`UPDATE routes SET ${sets.join(", ")} WHERE id = ?`).bind(...values).run();

	return json({ ok: true });
}

export async function handleGetImage(env: Env, key: string): Promise<Response> {
	const obj = await env.IMAGES.get(key);
	if (!obj) return new Response("Not found", { status: 404 });
	const headers = new Headers();
	obj.writeHttpMetadata(headers);
	headers.set("cache-control", "public, max-age=31536000, immutable");
	return new Response(obj.body, { headers });
}
