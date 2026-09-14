import { json } from "./util";

// 경유지 추가 화면의 GPS 버튼을 누르면, 좌표만 찍고 끝내는 대신 그 주변 실제 장소 목록을 보여줘서
// 사용자가 이름/주소를 직접 타이핑하지 않고 골라서 자동입력할 수 있게 한다 (텍스트 입력 최소화 목적).
// 카카오 로컬 API는 "키워드 검색"엔 검색어가 필수라 "주변에 뭐가 있는지" 자체는 못 찾아주므로,
// 대신 좌표 기반 카테고리 검색을 실제 경유지로 쓰일 법한 카테고리 몇 개에 병렬로 돌려 합친다.
const CATEGORY_GROUP_CODES = ["FD6", "CE7", "CS2", "MT1", "AT4", "CT1"] as const;

const CATEGORY_TO_STOP_TYPE: Record<string, string> = {
	FD6: "food", // 음식점
	CE7: "coffee", // 카페
	CS2: "life", // 편의점
	MT1: "life", // 대형마트
	AT4: "nature", // 관광명소
	CT1: "entertainment", // 문화시설
};

const STOP_TYPE_EMOJI: Record<string, string> = {
	food: "🍽️",
	coffee: "☕",
	entertainment: "🎮",
	nature: "🌳",
	life: "🏪",
};

interface KakaoPlaceDoc {
	id: string;
	place_name: string;
	category_group_code: string;
	road_address_name: string;
	address_name: string;
	x: string; // lng
	y: string; // lat
	distance: string;
}

export async function handleGetNearbyPlaces(request: Request, env: Env): Promise<Response> {
	const url = new URL(request.url);
	const lat = Number(url.searchParams.get("lat"));
	const lng = Number(url.searchParams.get("lng"));
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return json({ error: "lat and lng are required" }, 400);
	const radius = Math.min(Math.max(Number(url.searchParams.get("radius")) || 300, 50), 1000);

	const perCategory = await Promise.all(
		CATEGORY_GROUP_CODES.map(async (code) => {
			const params = new URLSearchParams({
				category_group_code: code,
				x: String(lng),
				y: String(lat),
				radius: String(radius),
				sort: "distance",
				size: "5",
			});
			const res = await fetch(`https://dapi.kakao.com/v2/local/search/category.json?${params}`, {
				headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` },
			});
			if (!res.ok) return [] as KakaoPlaceDoc[];
			const data = (await res.json()) as { documents?: KakaoPlaceDoc[] };
			return data.documents || [];
		})
	);

	const places = perCategory
		.flat()
		.map((d) => {
			const stopType = CATEGORY_TO_STOP_TYPE[d.category_group_code] || "life";
			return {
				name: d.place_name,
				address: d.road_address_name || d.address_name,
				lat: Number(d.y),
				lng: Number(d.x),
				distance: Math.round(Number(d.distance)),
				category: stopType,
				emoji: STOP_TYPE_EMOJI[stopType],
			};
		})
		.sort((a, b) => a.distance - b.distance)
		.slice(0, 8);

	return json({ places });
}
