import { json, timingSafeEqual } from "./util";

export async function handleAdminVerify(request: Request, env: Env): Promise<Response> {
	const token = request.headers.get("X-ADMIN-TOKEN") || "";
	if (!token || !env.ADMIN_TOKEN || !timingSafeEqual(token, env.ADMIN_TOKEN)) {
		return json({ ok: false }, 401);
	}
	return json({ ok: true });
}
