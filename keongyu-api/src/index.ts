/**
 * KEONGYU API Worker
 *
 * Endpoints:
 *   GET  /api/routes                       -> list routes (+ steps) from D1
 *   GET  /api/routes/:id                   -> one route (+ steps, comments, edit log)
 *   POST /api/routes                       -> create a route (steps + per-step photos -> R2)
 *   PATCH /api/routes/:id                  -> update route-level metadata (title/purpose/etc)
 *   PUT  /api/routes/:id/steps             -> replace a route's whole steps list (+ edit log)
 *   POST /api/routes/:id/like              -> toggle a like
 *   POST /api/routes/:id/checkin           -> toggle a GPS step check-in (+ points, comment)
 *   GET  /api/images/:key                  -> stream an R2-stored photo
 *   GET  /api/subscriptions?user_id=       -> a user's creator subscriptions
 *   POST /api/subscriptions                -> subscribe / change notif level
 *   DELETE /api/subscriptions?user_id=&creator= -> unsubscribe
 *   GET  /api/notifications?user_id=       -> a user's notifications
 *   POST /api/notifications/read-all       -> mark all of a user's notifications read
 *   GET  /api/users/:id                    -> profile (points + cosmetics/challenge blob)
 *   PATCH /api/users/:id                   -> update profile / adjust points
 *   GET  /api/chat?route_id=&step_index=   -> list chat messages
 *   POST /api/chat                         -> insert a chat message (DO broadcast: 5️⃣ 단계에서 연결)
 *   POST /api/auth/email/send              -> generate + email a 6-digit login code (real SMTP)
 *   POST /api/auth/email/verify            -> check a code, consume it on success
 *   POST /api/points/verify                -> verify a PortOne payment server-side, credit 별사탕
 *   GET  /api/deco/items                   -> 사진 꾸미기 아이템 카탈로그 (144개)
 *   GET  /api/deco/inventory?user_id=      -> 사용자가 소유한 꾸미기 아이템 id 목록
 *   POST /api/deco/buy                     -> 아이템 구매 (서버가 별사탕 차감 + 인벤토리 기록)
 *   POST /api/deco/random                  -> 별사탕 10개로 미소유 아이템 랜덤 뽑기 (rarity 가중치)
 *   POST /api/deco/save                    -> 합성된 꾸미기 사진(PNG)을 R2에 저장
 *   GET  /api/deco/creations?user_id=      -> 사용자가 저장한 꾸미기 결과물 목록
 *   GET  /api/route-skin/items             -> 루트카드 스킨 아이템 카탈로그 (144개, 12파츠)
 *   GET  /api/route-skin/inventory?user_id= -> 사용자가 소유한 루트카드 스킨 아이템 id 목록
 *   POST /api/route-skin/buy               -> 스킨 아이템 구매 (서버가 별사탕 차감 + 인벤토리 기록)
 *   ※ Turnstile 봇 방지는 사용자 요청으로 중단됨 (verifyTurnstile()는 남겨뒀지만 미호출)
 *   GET  /oauth/kakao/callback             -> Kakao OAuth redirect target
 *   GET  /api/admin/verify                 -> checks X-ADMIN-TOKEN header against env.ADMIN_TOKEN
 *   GET  /api/admin/reports?status=        -> list reports (X-ADMIN-TOKEN required; status defaults to "open")
 *   PATCH /api/admin/reports/:id           -> mark a report resolved + admin_logs entry (X-ADMIN-TOKEN required)
 *
 * Bindings (wrangler.jsonc): DB (D1), IMAGES (R2)
 * Secrets (wrangler secret put): TURNSTILE_SECRET_KEY, KAKAO_REST_API_KEY, (optional) KAKAO_CLIENT_SECRET,
 *   ADMIN_TOKEN, SMTP_SERVER, SMTP_PORT, SENDER_EMAIL, APP_PASSWORD
 *
 * No real session auth: every endpoint trusts whatever user_id/creator_id the client sends, same
 * trust model as the original 4-endpoint version of this Worker. Fine for this project's current
 * stage; real auth would be a separate piece of work.
 */
import "./types";
import { cors, json } from "./util";
import { handleAdminVerify, handleGetReports, handleResolveReport } from "./admin";
import { handleKakaoCallback } from "./kakao";
import { handleChat, handleGetChat } from "./chat";
import { handleGetRoutes, handleGetRouteDetail, handlePostRoutes, handlePutRouteSteps, handlePatchRoute, handleGetImage } from "./routes";
import { handleToggleLike, handleToggleCheckin, handleGetSubscriptions, handlePostSubscription, handleDeleteSubscription, handleGetNotifications, handleMarkAllNotificationsRead } from "./social";
import { handleGetUser, handlePatchUser } from "./profile";
import { handleSendEmailCode, handleVerifyEmailCode } from "./auth";
import { handleVerifyPayment } from "./points";
import { handleGetDecoItems, handleGetDecoInventory, handleBuyDecoItem, handleRandomDeco, handleSaveDecoCreation, handleGetDecoCreations } from "./deco";
import { handleGetRouteSkinItems, handleGetRouteSkinInventory, handleBuyRouteSkinItem } from "./routeSkin";

export default {
	async fetch(request, env, ctx): Promise<Response> {
		if (request.method === "OPTIONS") {
			return cors(new Response(null, { status: 204 }));
		}

		const url = new URL(request.url);
		const segments = url.pathname.split("/").filter(Boolean); // e.g. ["api","routes","r_1","like"]

		try {
			if (url.pathname === "/api/routes" && request.method === "GET") {
				return cors(await handleGetRoutes(env));
			}
			if (url.pathname === "/api/routes" && request.method === "POST") {
				return cors(await handlePostRoutes(request, env));
			}
			// /api/routes/:id
			if (segments[0] === "api" && segments[1] === "routes" && segments.length === 3 && request.method === "GET") {
				return cors(await handleGetRouteDetail(env, segments[2]));
			}
			if (segments[0] === "api" && segments[1] === "routes" && segments.length === 3 && request.method === "PATCH") {
				return cors(await handlePatchRoute(request, env, segments[2]));
			}
			// /api/routes/:id/steps
			if (segments[0] === "api" && segments[1] === "routes" && segments[3] === "steps" && request.method === "PUT") {
				return cors(await handlePutRouteSteps(request, env, segments[2]));
			}
			// /api/routes/:id/like
			if (segments[0] === "api" && segments[1] === "routes" && segments[3] === "like" && request.method === "POST") {
				return cors(await handleToggleLike(request, env, segments[2]));
			}
			// /api/routes/:id/checkin
			if (segments[0] === "api" && segments[1] === "routes" && segments[3] === "checkin" && request.method === "POST") {
				return cors(await handleToggleCheckin(request, env, segments[2]));
			}
			// /api/images/:key(/*)
			if (segments[0] === "api" && segments[1] === "images" && segments.length > 2 && request.method === "GET") {
				return await handleGetImage(env, segments.slice(2).join("/")); // no CORS wrapper needed for <img src>
			}
			if (url.pathname === "/api/subscriptions" && request.method === "GET") {
				const userId = url.searchParams.get("user_id");
				if (!userId) return cors(json({ error: "user_id is required" }, 400));
				return cors(await handleGetSubscriptions(env, userId));
			}
			if (url.pathname === "/api/subscriptions" && request.method === "POST") {
				return cors(await handlePostSubscription(request, env));
			}
			if (url.pathname === "/api/subscriptions" && request.method === "DELETE") {
				const userId = url.searchParams.get("user_id");
				const creator = url.searchParams.get("creator");
				if (!userId || !creator) return cors(json({ error: "user_id and creator are required" }, 400));
				return cors(await handleDeleteSubscription(env, userId, creator));
			}
			if (url.pathname === "/api/notifications" && request.method === "GET") {
				const userId = url.searchParams.get("user_id");
				if (!userId) return cors(json({ error: "user_id is required" }, 400));
				return cors(await handleGetNotifications(env, userId));
			}
			if (url.pathname === "/api/notifications/read-all" && request.method === "POST") {
				return cors(await handleMarkAllNotificationsRead(request, env));
			}
			// /api/users/:id
			if (segments[0] === "api" && segments[1] === "users" && segments.length === 3 && request.method === "GET") {
				return cors(await handleGetUser(env, segments[2]));
			}
			if (segments[0] === "api" && segments[1] === "users" && segments.length === 3 && request.method === "PATCH") {
				return cors(await handlePatchUser(request, env, segments[2]));
			}
			if (url.pathname === "/api/chat" && request.method === "GET") {
				return cors(await handleGetChat(request, env));
			}
			if (url.pathname === "/api/chat" && request.method === "POST") {
				return cors(await handleChat(request, env));
			}
			if (url.pathname === "/api/auth/email/send" && request.method === "POST") {
				return cors(await handleSendEmailCode(request, env));
			}
			if (url.pathname === "/api/auth/email/verify" && request.method === "POST") {
				return cors(await handleVerifyEmailCode(request, env));
			}
			if (url.pathname === "/api/points/verify" && request.method === "POST") {
				return cors(await handleVerifyPayment(request, env));
			}
			if (url.pathname === "/api/deco/items" && request.method === "GET") {
				return cors(await handleGetDecoItems(env));
			}
			if (url.pathname === "/api/deco/inventory" && request.method === "GET") {
				const userId = url.searchParams.get("user_id");
				if (!userId) return cors(json({ error: "user_id is required" }, 400));
				return cors(await handleGetDecoInventory(env, userId));
			}
			if (url.pathname === "/api/deco/buy" && request.method === "POST") {
				return cors(await handleBuyDecoItem(request, env));
			}
			if (url.pathname === "/api/deco/random" && request.method === "POST") {
				return cors(await handleRandomDeco(request, env));
			}
			if (url.pathname === "/api/deco/save" && request.method === "POST") {
				return cors(await handleSaveDecoCreation(request, env));
			}
			if (url.pathname === "/api/deco/creations" && request.method === "GET") {
				const userId = url.searchParams.get("user_id");
				if (!userId) return cors(json({ error: "user_id is required" }, 400));
				return cors(await handleGetDecoCreations(env, userId));
			}
			if (url.pathname === "/api/route-skin/items" && request.method === "GET") {
				return cors(await handleGetRouteSkinItems(env));
			}
			if (url.pathname === "/api/route-skin/inventory" && request.method === "GET") {
				const userId = url.searchParams.get("user_id");
				if (!userId) return cors(json({ error: "user_id is required" }, 400));
				return cors(await handleGetRouteSkinInventory(env, userId));
			}
			if (url.pathname === "/api/route-skin/buy" && request.method === "POST") {
				return cors(await handleBuyRouteSkinItem(request, env));
			}
			if (url.pathname === "/oauth/kakao/callback" && request.method === "GET") {
				return handleKakaoCallback(request, env); // full-page redirect, no CORS needed
			}
			if (url.pathname === "/api/admin/verify" && request.method === "GET") {
				return cors(await handleAdminVerify(request, env));
			}
			if (url.pathname === "/api/admin/reports" && request.method === "GET") {
				return cors(await handleGetReports(request, env));
			}
			// /api/admin/reports/:id
			if (segments[0] === "api" && segments[1] === "admin" && segments[2] === "reports" && segments.length === 4 && request.method === "PATCH") {
				return cors(await handleResolveReport(request, env, segments[3]));
			}
		} catch (err) {
			return cors(json({ error: (err as Error).message }, 500));
		}

		return cors(new Response("Not found", { status: 404 }));
	},
} satisfies ExportedHandler<Env>;
