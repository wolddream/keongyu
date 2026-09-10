import { json } from "./util";

// 루트카드 스킨 - 업로드 시 12파츠(card_bg/map_style/route_line/pin_start/pin_via/pin_end/
// title_badge/author_badge/weather_effect/frame/sticker/filter_aura)를 별사탕으로 꾸미는 기능.
// 아이템 카탈로그/소유권/포인트 차감은 deco.ts와 동일하게 전부 서버(D1)가 관리한다 - 클라이언트가
// 보내는 "샀다"는 말을 믿지 않고 서버가 직접 잔액을 깎고 인벤토리에 기록한다. 장착 상태 자체
// (route.skin_json)는 handlePatchRoute/handlePostRoutes(routes.ts)가 다루고, 여기는 아이템
// 카탈로그 조회 + 구매(영구 소유, 환불 없음 - custom/deco 상점과 동일한 정책)만 담당한다.

interface RouteSkinItemRow {
	id: string;
	part: string;
	name: string;
	rarity: string;
	price: number;
	emoji: string;
}

export async function handleGetRouteSkinItems(env: Env): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, part, name, rarity, price, emoji FROM route_skin_items ORDER BY part, price`
	).all<RouteSkinItemRow>();
	return json({ items: results ?? [] });
}

export async function handleGetRouteSkinInventory(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(`SELECT item_id FROM route_skin_inventory WHERE user_id = ?`).bind(userId).all<{ item_id: string }>();
	return json({ item_ids: (results ?? []).map((r) => r.item_id) });
}

export async function handleBuyRouteSkinItem(request: Request, env: Env): Promise<Response> {
	const { user_id, item_id } = (await request.json()) as { user_id?: string; item_id?: string };
	if (!user_id || !item_id) return json({ error: "user_id and item_id are required" }, 400);

	// Idempotent: already-owned items aren't rechargeable, just report success without touching points.
	const already = await env.DB.prepare(`SELECT 1 FROM route_skin_inventory WHERE user_id = ? AND item_id = ?`).bind(user_id, item_id).first();
	if (already) return json({ ok: true, already_owned: true });

	const item = await env.DB.prepare(`SELECT id, price FROM route_skin_items WHERE id = ?`).bind(item_id).first<{ id: string; price: number }>();
	if (!item) return json({ error: "존재하지 않는 아이템이에요." }, 404);

	const userRow = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	const points = userRow?.points ?? 0;
	if (points < item.price) return json({ error: `별사탕이 부족해요! (보유: ${points}개 / 필요: ${item.price}개)` }, 402);

	// Same double-spend guard as deco.ts's handleBuyDecoItem: the inventory INSERT's (user_id,
	// item_id) primary key means only one of two racing batches actually inserts a row, and D1
	// runs a batch as one transaction, so the loser's points deduction rolls back with it.
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO route_skin_inventory (user_id, item_id) VALUES (?, ?)`).bind(user_id, item_id),
		env.DB.prepare(`UPDATE users SET points = points - ? WHERE id = ? AND points >= ?`).bind(item.price, user_id, item.price),
	]);

	const row = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	return json({ ok: true, points: row?.points ?? points });
}
