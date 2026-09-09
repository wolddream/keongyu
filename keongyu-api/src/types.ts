export {};

declare global {
	interface Env {
		DB: D1Database;
		IMAGES: R2Bucket;
		TURNSTILE_SECRET_KEY: string;
		KAKAO_REST_API_KEY: string;
		KAKAO_CLIENT_SECRET?: string;
		ADMIN_TOKEN: string;
		SMTP_SERVER: string;
		SMTP_PORT: string;
		SENDER_EMAIL: string;
		APP_PASSWORD: string;
	}
}
