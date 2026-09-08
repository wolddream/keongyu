# 경유(KEONGYU) Cloudflare Full 구축 가이드

> 📌 Supabase + Vercel → Cloudflare로 완전 이전. 월 비용 25$ → 0~5$로 절감, R2 egress 0원이 핵심.

---

## 0️⃣ 계정 & 도구 (10분)

- [ ] Cloudflare 가입 https://dash.cloudflare.com/sign-up
- [ ] Node.js 18+ 설치 https://nodejs.org/
- [ ] Wrangler 설치
```bash
npm install -g wrangler
wrangler login
```
> 🔗 https://developers.cloudflare.com/workers/wrangler/install-and-update/

---

## 1️⃣ Pages - 프론트 배포 (Vercel 대체)

- [ ] Pages 생성: Dash → Workers & Pages → Create Application → Pages → Connect to Git
  - Build preset: None, Output: `/`
- [ ] 커스텀 도메인: Pages → Custom domains → `keongyu.app` 연결
  - 도메인 구매: Dash → Domain Registration https://dash.cloudflare.com/ (1만원/년)
- [ ] 로컬 테스트: `npx wrangler pages dev ./`

> 🔗 https://developers.cloudflare.com/pages/get-started/

---

## 2️⃣ D1 - DB (Supabase Postgres 대체)

- [ ] DB 생성
```bash
wrangler d1 create keongyu-db
# 나온 database_id 복사!
```
> Dash: Workers & Pages → D1 / https://developers.cloudflare.com/d1/get-started/

- [ ] `schema.sql` 생성 후 실행
```sql
CREATE TABLE users (id TEXT PRIMARY KEY, name TEXT, points INTEGER, avatar TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE routes (id TEXT PRIMARY KEY, creator_id TEXT, title TEXT, purpose TEXT, distance TEXT, time TEXT, budget TEXT, likes INTEGER DEFAULT 0, is_public INTEGER, is_collaborative INTEGER, image_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE steps (id TEXT PRIMARY KEY, route_id TEXT, step_order INTEGER, name TEXT, address TEXT, lat REAL, lng REAL, cost TEXT, memo TEXT, type TEXT);
CREATE TABLE participants (route_id TEXT, user_id TEXT, role TEXT, joined_at DATETIME, PRIMARY KEY(route_id, user_id));
CREATE TABLE chats (id TEXT PRIMARY KEY, route_id TEXT, step_index INTEGER, user_id TEXT, user_name TEXT, avatar TEXT, text TEXT, type TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE subscriptions (user_id TEXT, creator_id TEXT, notif_level TEXT, PRIMARY KEY(user_id, creator_id));
CREATE TABLE points_history (id TEXT PRIMARY KEY, user_id TEXT, amount INTEGER, reason TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
```
```bash
wrangler d1 execute keongyu-db --file=./schema.sql
wrangler d1 execute keongyu-db --command="SELECT * FROM routes"
```

---

## 3️⃣ R2 - 이미지 저장 (핵심! egress 0원)

- [ ] 버킷 생성: Dash → R2 Object Storage → Create bucket → `keongyu-images`
> https://developers.cloudflare.com/r2/get-started/

- [ ] Public URL 활성화: R2 → Settings → Public Access → Allow Access
  - 커스텀 도메인: `img.keongyu.app` 연결 추천

- [ ] wrangler.toml 바인딩
```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "keongyu-images"
```

> 💡 R2가 제일 중요: Supabase/ S3는 이미지 다운로드할 때마다 과금, R2는 0원. 경유는 사진 90%라 비용 차이 큼.

---

## 4️⃣ Workers - API 서버

- [ ] 프로젝트 생성
```bash
npm create cloudflare@latest keongyu-api -- --type=hello-world
cd keongyu-api
```
> https://developers.cloudflare.com/workers/get-started/

- [ ] `wrangler.toml` 설정
```toml
name = "keongyu-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "keongyu-db"
database_id = "여기에_2단계_id_붙여넣기"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "keongyu-images"

[vars]
KAKAO_JS_KEY = "카카오_JS_키"
```

- [ ] `src/index.ts` 엔드포인트 4개
  - `GET /api/routes` → D1 조회
  - `POST /api/routes` → D1 insert + R2 upload
  - `POST /api/collab/join` → participants 추가
  - `POST /api/chat` → chats insert + Durable Object broadcast
> 예제: https://developers.cloudflare.com/d1/examples/d1-and-workers/

- [ ] 배포
```bash
wrangler deploy
# https://keongyu-api.xxx.workers.dev 생성됨
```

---

## 5️⃣ Durable Objects - 실시간 채팅 (Supabase Realtime 대체)

- [ ] Paid 플랜 활성화: Dash → Workers & Pages → Durable Objects (5$/월, 첫달 무료)
> https://developers.cloudflare.com/durable-objects/get-started/

- [ ] `wrangler.toml` 추가
```toml
[durable_objects]
bindings = [{name="CHAT_ROOM", class_name="ChatRoom"}]

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]
```

- [ ] `src/chat.ts` - 공식 예제 복사
> https://developers.cloudflare.com/durable-objects/api/websockets/

- [ ] 프론트 연결
```js
const ws = new WebSocket(`wss://keongyu-api.xxx.workers.dev/chat/${routeId}`)
ws.onmessage = (e) => { state.chat.push(JSON.parse(e.data)); render(); }
```

---

## 6️⃣ 인증 & 카카오

- [ ] Kakao Developers 앱 생성 https://developers.kakao.com/
  - 내 애플리케이션 → 앱 만들기 → JS 키 복사
  - 플랫폼 → Web → 도메인: `https://keongyu.app`, `http://localhost:3000`
> https://developers.kakao.com/docs/latest/ko/kakaotalk/picker/js

- [ ] 실제 코드 (주석으로 넣어두기)
```js
Kakao.init('YOUR_JS_KEY')
Kakao.Picker.selectFriends({title:'함께 갈 친구 선택', maxPickableCount:5})
  .then(friends => friends.users.forEach(f => addParticipant(routeId, f.displayName)))
```

---

## 7️⃣ 결제 - 별사탕 (PortOne)

- [ ] PortOne 가입 https://portone.io/ → Store ID, Channel Key 발급
> https://developers.portone.io/

- [ ] Workers 검증 엔드포인트
```
POST /api/points/verify
→ PortOne API 검증 → D1 users.points += + points_history insert
```

---

## 8️⃣ 배포 & 모니터링

- [ ] Pages + Workers 라우팅: Pages `_routes.json`으로 `/api/*` → Workers 프록시
> https://developers.cloudflare.com/pages/functions/

- [ ] Web Analytics: Dash → Analytics → Web Analytics → Add site → `keongyu.app` (무료)

- [ ] Turnstile (봇 방지): Dash → Turnstile → 댓글/업로드에 추가 (무료, 캡차 대체)

---

## 9️⃣ 최종 체크

- [ ] `wrangler d1 execute keongyu-db --command="SELECT COUNT(*) FROM routes"` → 데이터 있음?
- [ ] `keongyu.app`에서 이미지 업로드 → R2에 저장되고 보이는가?
- [ ] 2개 브라우저로 같은 route 채팅 → 실시간으로 보이는가?
- [ ] Lighthouse 90+?

---

## 🔗 링크 모음

- 대시보드: https://dash.cloudflare.com/
- Workers: https://developers.cloudflare.com/workers/
- Pages: https://developers.cloudflare.com/pages/
- D1: https://developers.cloudflare.com/d1/
- R2: https://developers.cloudflare.com/r2/
- Durable Objects: https://developers.cloudflare.com/durable-objects/
- Wrangler: https://developers.cloudflare.com/workers/wrangler/
- Kakao: https://developers.kakao.com/
- PortOne: https://portone.io/

---

## 💰 비용 비교

|  | Supabase+Vercel | Cloudflare Full |
| --- | --- | --- |
| 호스팅 | Vercel 0~20$ | Pages 0$ (무제한) |
| DB | 0~25$ | D1 0$ (500만 읽기 무료) |
| 이미지 | egress 0.09$/GB | R2 0$ (egress 무료) |
| 서버 | 0~ | Workers 0$ (10만 req/일 무료) |
| **합계 (MAU 1만)** | **0~25$** | **0~5$** |

> ✅ 추천: 1~2주 베타는 `Pages + Supabase`로 빠르게, MAU 5천 넘으면 `Full`로 이전 (1일 컷)

---

## 📦 다음 단계

- [ ] 이 페이지를 Notion 데이터베이스로 만들기 → 상태: 진행중/완료
- [ ] `wrangler.toml` + `schema.sql` + `src/index.ts` 스타터킷 필요하면 말하기

작성: KEONGYU Team | Cloudflare Full Guide | 2026-05-13
