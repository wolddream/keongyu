import { json, uid } from "./util";

// Source of truth for what each charge pack costs / awards - must mirror the packs offered in
// index.html's charge sheet. The client only ever sends a PortOne payment id, never a points
// amount, so a tampered request can't claim more points than it actually paid for.
const CHARGE_PACKS: { won: number; points: number }[] = [
	{ won: 1000, points: 100 },
	{ won: 3000, points: 360 },
	{ won: 5000, points: 700 },
	{ won: 10000, points: 1600 },
];

const PORTONE_STORE_ID = "store-7baaa782-32ab-4a91-8d98-37229cf118a5";

interface PortOnePayment {
	status: string;
	storeId: string;
	amount: { total: number };
	customer?: { id?: string };
}

export async function handleVerifyPayment(request: Request, env: Env): Promise<Response> {
	const { payment_id, user_id } = (await request.json()) as { payment_id?: string; user_id?: string };
	if (!payment_id || !user_id) return json({ error: "payment_id and user_id are required" }, 400);

	// Idempotent: if this payment was already recorded (e.g. the client retried after a network
	// hiccup on the first response), just report the current balance instead of crediting twice.
	// Must also recheck the payment's own user_id here, the same way the fresh-verification path
	// below checks payment.customer.id - otherwise anyone who learns an already-processed payment_id
	// could pair it with an arbitrary user_id and have this branch hand back that user's point
	// balance (an IDOR leak of another account's balance, even though no points actually move).
	const already = await env.DB.prepare(`SELECT id FROM payments WHERE id = ? AND user_id = ?`).bind(payment_id, user_id).first();
	if (already) {
		const row = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
		return json({ ok: true, points: row?.points ?? 0, already_processed: true });
	}

	const portoneRes = await fetch(`https://api.portone.io/payments/${encodeURIComponent(payment_id)}`, {
		headers: { Authorization: `PortOne ${env.PORTONE_API_SECRET}` },
	});
	if (!portoneRes.ok) return json({ error: "결제 검증에 실패했어요." }, 502);
	const payment = (await portoneRes.json()) as PortOnePayment;

	if (payment.storeId !== PORTONE_STORE_ID) return json({ error: "결제 정보가 올바르지 않아요." }, 400);
	if (payment.status !== "PAID") return json({ error: `결제가 완료되지 않았어요. (상태: ${payment.status})` }, 400);
	// The client sets customer.customerId to its own user id when opening the PortOne checkout
	// (index.html confirmCharge()), so PortOne's record of who actually paid is a check we can run
	// independently of anything the client tells us here. Without this, anyone who learns another
	// user's still-unclaimed payment_id (already PAID, e.g. leaked via a redirect/referrer) could
	// call this endpoint with their own user_id and claim someone else's payment as their own points.
	if (payment.customer?.id !== user_id) return json({ error: "결제 정보가 올바르지 않아요." }, 400);

	const pack = CHARGE_PACKS.find((p) => p.won === payment.amount.total);
	if (!pack) return json({ error: "결제 금액이 충전 팩과 일치하지 않아요." }, 400);

	await env.DB.batch([
		env.DB.prepare(`INSERT INTO payments (id, user_id, pack_amount, paid_won, status) VALUES (?, ?, ?, ?, 'verified')`).bind(
			payment_id,
			user_id,
			pack.points,
			pack.won
		),
		env.DB.prepare(`INSERT INTO users (id, points) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET points = points + excluded.points`).bind(
			user_id,
			pack.points
		),
		env.DB.prepare(`INSERT INTO points_history (id, user_id, amount, reason) VALUES (?, ?, ?, ?)`).bind(
			uid("p"),
			user_id,
			pack.points,
			`충전: ${pack.won.toLocaleString()}원`
		),
	]);

	const row = await env.DB.prepare(`SELECT points FROM users WHERE id = ?`).bind(user_id).first<{ points: number }>();
	return json({ ok: true, points: row?.points ?? pack.points });
}
