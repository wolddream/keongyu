import { json, uid } from "./util";

// 별사탕(포인트) 선물하기. 화폐는 users.points 하나뿐이다 - 결제 검증(points.ts)/스킨
// 구매(routeSkin.ts)와 같은 이유로, 클라이언트가 보내는 "보냈다"는 말을 믿지 않고 여기서
// 잔액/한도를 직접 확인한 뒤 서버가 원자적으로 차감·지급한다.

const MIN_GIFT_AMOUNT = 5;
const DAILY_GIFT_LIMIT = 200;
const REPLY_BONUS_WINDOW_DAYS = 3;
const REPLY_BONUS_RATE = 0.1;

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

interface UserRow {
	id: string;
	points: number;
	name: string | null;
	daily_gift_sent: number | null;
	last_gift_date: string | null;
}

export async function handleSendGift(request: Request, env: Env): Promise<Response> {
	const body = (await request.json()) as {
		from_user_id?: string;
		from_user_name?: string;
		to_user_id?: string;
		to_user_name?: string;
		amount?: number;
		message?: string;
		route_id?: string;
	};
	const { from_user_id, to_user_id, route_id } = body;
	const amount = Math.floor(Number(body.amount));
	const message = (body.message || "").slice(0, 200);

	if (!from_user_id || !to_user_id) return json({ error: "from_user_id and to_user_id are required" }, 400);
	if (from_user_id === to_user_id) return json({ error: "자기 자신에게는 선물할 수 없어요." }, 400);
	if (!Number.isFinite(amount) || amount < MIN_GIFT_AMOUNT) return json({ error: `최소 ${MIN_GIFT_AMOUNT}개부터 선물할 수 있어요.` }, 400);

	// Upsert both sides so a gift to/from someone who never touched `users` before doesn't 404.
	await env.DB.batch([
		env.DB.prepare(`INSERT INTO users (id, name, points) VALUES (?, ?, 0) ON CONFLICT(id) DO NOTHING`).bind(from_user_id, body.from_user_name || from_user_id),
		env.DB.prepare(`INSERT INTO users (id, name, points) VALUES (?, ?, 0) ON CONFLICT(id) DO NOTHING`).bind(to_user_id, body.to_user_name || to_user_id),
	]);

	const fromUser = await env.DB.prepare(`SELECT id, points, name, daily_gift_sent, last_gift_date FROM users WHERE id = ?`)
		.bind(from_user_id)
		.first<UserRow>();
	if (!fromUser) return json({ error: "보내는 사람 정보를 찾을 수 없어요." }, 404);

	const today = todayStr();
	const sentToday = fromUser.last_gift_date === today ? fromUser.daily_gift_sent || 0 : 0;
	if (sentToday + amount > DAILY_GIFT_LIMIT) {
		return json({ error: `하루에 선물할 수 있는 별사탕은 ${DAILY_GIFT_LIMIT}개까지예요. (오늘 ${sentToday}개 보냄)` }, 429);
	}
	if ((fromUser.points || 0) < amount) {
		return json({ error: `별사탕이 부족해요! (보유: ${fromUser.points}개 / 필요: ${amount}개)` }, 402);
	}

	// 답례 보너스: 최근 REPLY_BONUS_WINDOW_DAYS일 안에 받는 사람이 보내는 사람에게 먼저
	// 선물한 적이 있으면, 이번 선물이 그 답례로 간주되어 양쪽 모두 amount*10%(올림)를 더 받는다.
	const priorGift = await env.DB.prepare(
		`SELECT id FROM candy_gifts WHERE from_user_id = ? AND to_user_id = ? AND created_at >= datetime('now', ?) ORDER BY created_at DESC LIMIT 1`
	)
		.bind(to_user_id, from_user_id, `-${REPLY_BONUS_WINDOW_DAYS} days`)
		.first<{ id: string }>();
	const bonus = priorGift ? Math.ceil(amount * REPLY_BONUS_RATE) : 0;

	const giftId = uid("gift");
	const notifId = uid("notif");
	const title = bonus ? `별사탕 선물 도착! 🌟 (답례 보너스 +${bonus})` : "별사탕 선물 도착! 🌟";

	const statements = [
		env.DB.prepare(`UPDATE users SET points = points - ?, daily_gift_sent = ?, last_gift_date = ? WHERE id = ? AND points >= ?`).bind(
			amount,
			sentToday + amount,
			today,
			from_user_id,
			amount
		),
		env.DB.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).bind(amount + bonus, to_user_id),
		env.DB.prepare(
			`INSERT INTO candy_gifts (id, from_user_id, from_user_name, to_user_id, to_user_name, amount, message, route_id, is_reply_bonus) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).bind(giftId, from_user_id, body.from_user_name || fromUser.name || from_user_id, to_user_id, body.to_user_name || to_user_id, amount, message, route_id || null, bonus ? 1 : 0),
		env.DB.prepare(`INSERT INTO notifications (id, user_id, creator, title, route_id, type, body) VALUES (?, ?, ?, ?, ?, 'gift', ?)`).bind(
			notifId,
			to_user_id,
			body.from_user_name || fromUser.name || from_user_id,
			title,
			route_id || null,
			message
		),
	];
	if (bonus > 0) {
		statements.push(env.DB.prepare(`UPDATE users SET points = points + ? WHERE id = ?`).bind(bonus, from_user_id));
	}
	await env.DB.batch(statements);

	const updated = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(from_user_id).first<{ points: number }>();
	return json({ ok: true, new_balance: updated?.points ?? fromUser.points - amount + bonus, bonus_given: bonus });
}

interface CandyGiftRow {
	id: string;
	from_user_id: string;
	from_user_name: string | null;
	amount: number;
	message: string | null;
	route_id: string | null;
	is_reply_bonus: number;
	is_read: number;
	created_at: string;
}

export async function handleGetGiftbox(env: Env, userId: string): Promise<Response> {
	const { results } = await env.DB.prepare(
		`SELECT id, from_user_id, from_user_name, amount, message, route_id, is_reply_bonus, is_read, created_at
		 FROM candy_gifts WHERE to_user_id = ? ORDER BY created_at DESC LIMIT 100`
	)
		.bind(userId)
		.all<CandyGiftRow>();
	return json({ gifts: results ?? [] });
}

export async function handleMarkGiftboxRead(request: Request, env: Env): Promise<Response> {
	const { user_id } = (await request.json()) as { user_id?: string };
	if (!user_id) return json({ error: "user_id is required" }, 400);
	await env.DB.prepare(`UPDATE candy_gifts SET is_read = 1 WHERE to_user_id = ?`).bind(user_id).run();
	return json({ ok: true });
}
