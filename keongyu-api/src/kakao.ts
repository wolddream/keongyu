import { toBase64Utf8 } from "./util";

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

export async function handleKakaoCallback(request: Request, env: Env): Promise<Response> {
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
