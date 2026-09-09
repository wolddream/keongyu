export function json(data: unknown, status = 200): Response {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "content-type": "application/json; charset=utf-8" },
	});
}

export function cors(resp: Response): Response {
	resp.headers.set("Access-Control-Allow-Origin", "*");
	resp.headers.set("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
	resp.headers.set("Access-Control-Allow-Headers", "Content-Type, X-ADMIN-TOKEN");
	return resp;
}

export function uid(prefix: string): string {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

// Constant-time string compare - avoids leaking ADMIN_TOKEN length/prefix via response timing.
export function timingSafeEqual(a: string, b: string): boolean {
	const enc = new TextEncoder();
	const aBytes = enc.encode(a);
	const bBytes = enc.encode(b);
	if (aBytes.length !== bBytes.length) {
		let dummy = 0;
		for (let i = 0; i < aBytes.length; i++) dummy |= aBytes[i] ^ (bBytes[i % (bBytes.length || 1)] || 0);
		return false;
	}
	let diff = 0;
	for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
	return diff === 0;
}

// UTF-8 safe base64 (btoa() alone mangles multi-byte chars like Korean nicknames).
export function toBase64Utf8(obj: unknown): string {
	const bytes = new TextEncoder().encode(JSON.stringify(obj));
	let binary = "";
	bytes.forEach((b) => (binary += String.fromCharCode(b)));
	return btoa(binary);
}

// Verifies a Turnstile token (form field "cf-turnstile-response") against Cloudflare's siteverify API.
// Currently unused - Turnstile checks were disabled per a prior user request (frontend widget was
// removed too). Left in place so re-enabling is a matter of calling this + rejecting on false.
export async function verifyTurnstile(token: string | null | undefined, ip: string | null, secret: string): Promise<boolean> {
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

export function safeJsonParse<T>(text: string | null | undefined, fallback: T): T {
	if (!text) return fallback;
	try {
		return JSON.parse(text) as T;
	} catch {
		return fallback;
	}
}
