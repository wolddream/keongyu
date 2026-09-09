import { json } from "./util";
import { sendEmail } from "./email";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

export async function handleSendEmailCode(request: Request, env: Env): Promise<Response> {
	const { email } = (await request.json()) as { email?: string };
	if (!email || !email.includes("@")) return json({ error: "올바른 이메일을 입력해주세요." }, 400);

	const existing = await env.DB.prepare(`SELECT expires_at FROM email_codes WHERE email = ?`).bind(email).first<{ expires_at: number }>();
	if (existing) {
		const sentAt = existing.expires_at - CODE_TTL_MS;
		if (Date.now() - sentAt < RESEND_COOLDOWN_MS) {
			return json({ error: "잠시 후 다시 시도해주세요. (30초 제한)" }, 429);
		}
	}

	const code = String(Math.floor(100000 + Math.random() * 900000));
	const expiresAt = Date.now() + CODE_TTL_MS;
	await env.DB.prepare(
		`INSERT INTO email_codes (email, code, expires_at, attempts) VALUES (?, ?, ?, 0)
		 ON CONFLICT(email) DO UPDATE SET code = excluded.code, expires_at = excluded.expires_at, attempts = 0`
	)
		.bind(email, code, expiresAt)
		.run();

	try {
		await sendEmail(env, {
			to: email,
			subject: `[경유] 인증코드 ${code}`,
			text: `경유(KEONGYU) 로그인 인증코드는 ${code} 입니다.\n10분 이내에 입력해주세요.\n본인이 요청하지 않았다면 이 메일은 무시하셔도 됩니다.`,
		});
	} catch (err) {
		console.error("sendEmail failed:", (err as Error).message, (err as Error).stack);
		// Roll the pending code back so a fixable retry (e.g. SMTP hiccup) isn't stuck behind the
		// 30s resend cooldown for a code that was never actually delivered.
		await env.DB.prepare(`DELETE FROM email_codes WHERE email = ?`).bind(email).run();
		return json({ error: "이메일 발송에 실패했어요. 잠시 후 다시 시도해주세요." }, 502);
	}

	return json({ ok: true });
}

export async function handleVerifyEmailCode(request: Request, env: Env): Promise<Response> {
	const { email, code } = (await request.json()) as { email?: string; code?: string };
	if (!email || !code) return json({ error: "email and code are required" }, 400);

	const row = await env.DB.prepare(`SELECT code, expires_at, attempts FROM email_codes WHERE email = ?`)
		.bind(email)
		.first<{ code: string; expires_at: number; attempts: number }>();
	if (!row) return json({ error: "인증코드를 먼저 요청해주세요." }, 400);
	if (Date.now() > row.expires_at) {
		await env.DB.prepare(`DELETE FROM email_codes WHERE email = ?`).bind(email).run();
		return json({ error: "인증코드가 만료됐어요. 다시 요청해주세요." }, 400);
	}
	if (row.attempts >= MAX_ATTEMPTS) {
		await env.DB.prepare(`DELETE FROM email_codes WHERE email = ?`).bind(email).run();
		return json({ error: "시도 횟수를 초과했어요. 다시 요청해주세요." }, 400);
	}
	if (row.code !== code.trim()) {
		await env.DB.prepare(`UPDATE email_codes SET attempts = attempts + 1 WHERE email = ?`).bind(email).run();
		return json({ error: "인증코드가 일치하지 않아요." }, 400);
	}

	await env.DB.prepare(`DELETE FROM email_codes WHERE email = ?`).bind(email).run();
	return json({ ok: true });
}
