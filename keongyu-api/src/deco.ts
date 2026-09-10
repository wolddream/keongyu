import { json, uid, safeJsonParse } from "./util";

// "사진 꾸미기" - 풍경/음식 사진 위에 12단계 레이어(z1~z12) 아이템을 올려 합성하는 기능.
// 아이템 카탈로그/소유권/포인트 차감은 전부 서버(D1)가 관리한다 - 별사탕 결제 검증과 같은 이유로,
// 클라이언트가 보내는 "샀다"는 말을 믿지 않고 서버가 직접 잔액을 깎고 인벤토리에 기록한다.

interface DecoItemRow {
	id: string;
	category: string;
	part: string;
	z_index: number;
	name: string;
	rarity: string;
	price: number;
	emoji: string;
}

export async function handleGetDecoItems(env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, category, part, z_index, name, rarity, price, emoji FROM deco_items ORDER BY category, z_index, price`
	).all<DecoItemRow>();
	return json({ items: results ?? [] });
}

export async function handleGetDecoInventory(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(`SELECT item_id FROM deco_inventory WHERE user_id = ?`).bind(userId).all<{ item_id: string }>();
	return json({ item_ids: (results ?? []).map((r) => r.item_id) });
}

export async function handleBuyDecoItem(request: Request, env: Env): Promise<Response> {
	const { user_id, item_id } = (await request.json()) as { user_id?: string; item_id?: string };
	if (!user_id || !item_id) return json({ error: "user_id and item_id are required" }, 400);

	// Idempotent: already-owned items aren't rechargeable, just report success without touching points.
	const already = await env.DB.prepare(`SELECT 1 FROM deco_inventory WHERE user_id = ? AND item_id = ?`).bind(user_id, item_id).first();
	if (already) return json({ ok: true, already_owned: true });

	const item = await env.DB.prepare(`SELECT id, price FROM deco_items WHERE id = ?`).bind(item_id).first<{ id: string; price: number }>();
	if (!item) return json({ error: "존재하지 않는 아이템이에요." }, 404);

	const userRow = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	const points = userRow?.points ?? 0;
	if (points < item.price) return json({ error: `별사탕이 부족해요! (보유: ${points}개 / 필요: ${item.price}개)` }, 402);

	// Re-check-and-set inside the same batch as the deduction so a second concurrent buy for the
	// same item can't both pass the "already owned" check above and double-spend points: the
	// inventory INSERT has (user_id, item_id) as its primary key, so only one of two racing batches
	// actually inserts a row - D1 runs a batch as one transaction, so the loser's points deduction
	// is rolled back with it instead of silently charging the user twice for one item.
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO deco_inventory (user_id, item_id) VALUES (?, ?)`).bind(user_id, item_id),
		env.DB.prepare(`UPDATE users SET points = points - ? WHERE id = ? AND points >= ?`).bind(item.price, user_id, item.price),
	]);

	const row = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	return json({ ok: true, points: row?.points ?? points });
}

const RANDOM_DECO_COST = 10;
// Weighted so a 10-별사탕 pull mostly gives commons, matching the paid packs' relative value.
const RARITY_WEIGHTS: Record<string, number> = { N: 70, R: 24, SR: 5, SSR: 1 };

export async function handleRandomDeco(request: Request, env: Env): Promise<Response> {
	const { user_id, category } = (await request.json()) as { user_id?: string; category?: string };
	if (!user_id || (category !== "landscape" && category !== "food")) {
		return json({ error: "user_id and category ('landscape'|'food') are required" }, 400);
	}

	const userRow = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	const points = userRow?.points ?? 0;
	if (points < RANDOM_DECO_COST) return json({ error: `별사탕이 부족해요! (보유: ${points}개 / 필요: ${RANDOM_DECO_COST}개)` }, 402);

	const { results: owned } = await env.DB.prepare(`SELECT item_id FROM deco_inventory WHERE user_id = ?`).bind(user_id).all<{ item_id: string }>();
	const ownedIds = new Set((owned ?? []).map((r) => r.item_id));
	const { results: candidates } = await env.DB.prepare(`SELECT id, rarity FROM deco_items WHERE category = ?`)
		.bind(category)
		.all<{ id: string; rarity: string }>();
	const pool = (candidates ?? []).filter((c) => !ownedIds.has(c.id));
	if (pool.length === 0) return json({ error: "이 카테고리의 아이템을 이미 모두 보유하고 있어요!" }, 409);

	const weighted = pool.flatMap((c) => Array(RARITY_WEIGHTS[c.rarity] ?? 1).fill(c.id));
	const pick = weighted[Math.floor(Math.random() * weighted.length)];

	await env.DB.batch([
		env.DB.prepare(`UPDATE users SET points = points - ? WHERE id = ? AND points >= ?`).bind(RANDOM_DECO_COST, user_id, RANDOM_DECO_COST),
		env.DB.prepare(`INSERT INTO deco_inventory (user_id, item_id) VALUES (?, ?) ON CONFLICT(user_id, item_id) DO NOTHING`).bind(user_id, pick),
	]);

	const item = await env.DB.prepare(`SELECT id, category, part, z_index, name, rarity, price, emoji FROM deco_items WHERE id = ?`)
		.bind(pick)
		.first<DecoItemRow>();
	const row = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	return json({ ok: true, item, points: row?.points ?? points });
}

// POST /api/deco/save - multipart/form-data: user_id, category, layers (JSON string), photo (file)
// The client composites the final PNG itself (canvas, see renderDecoCanvas() in index.html) and
// uploads the result here, same division of labor as the rest of this Worker (it never renders
// images server-side) - this endpoint just persists that PNG to R2 and records what layers made it.
export async function handleSaveDecoCreation(request: Request, env: Env): Promise<Response> {
	const form = await request.formData();
	const userId = String(form.get("user_id") || "");
	const category = String(form.get("category") || "");
	const layersJson = String(form.get("layers") || "[]");
	const file = form.get("photo");
	if (!userId || !category || !(file instanceof File)) {
		return json({ error: "user_id, category and photo are required" }, 400);
	}

	const id = uid("deco");
	const key = `deco/${userId}/${id}.png`;
	await env.DB.prepare(`INSERT INTO users (id, points) VALUES (?, 0) ON CONFLICT(id) DO NOTHING`).bind(userId).run();
	await env.IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "image/png" } });
	await env.DB.prepare(`INSERT INTO deco_creations (id, user_id, category, image_key, layers_json) VALUES (?, ?, ?, ?, ?)`)
		.bind(id, userId, category, key, layersJson)
		.run();

	return json({ ok: true, id, image_key: key });
}

interface DecoCreationRow {
	id: string;
	category: string;
	image_key: string;
	layers_json: string | null;
	created_at: string;
}

export async function handleGetDecoCreations(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, category, image_key, layers_json, created_at FROM deco_creations WHERE user_id = ? ORDER BY created_at DESC LIMIT 60`
	)
		.bind(userId)
		.all<DecoCreationRow>();
	return json({
		creations: (results ?? []).map((r) => ({ ...r, layers: safeJsonParse(r.layers_json, []) })),
	});
}
