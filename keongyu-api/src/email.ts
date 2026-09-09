// Sends transactional email straight over SMTP (Gmail, port 587 + STARTTLS) using Cloudflare's
// TCP Sockets API - no external email API/account beyond the Gmail address + app password the
// user already has (env.SENDER_EMAIL / env.APP_PASSWORD). This is a hand-rolled SMTP client since
// Workers can't use Node's smtp libraries; kept intentionally minimal (just enough of RFC 5321 to
// talk to Gmail's server), not a general-purpose mailer.
import { connect } from "cloudflare:sockets";

function utf8ToBase64(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	bytes.forEach((b) => (binary += String.fromCharCode(b)));
	return btoa(binary);
}

// Escapes any body line that starts with "." per SMTP's dot-stuffing rule (RFC 5321 4.5.2) -
// otherwise such a line would be misread as the end-of-DATA terminator.
function dotStuff(text: string): string {
	return text
		.split("\r\n")
		.map((line) => (line.startsWith(".") ? "." + line : line))
		.join("\r\n");
}

async function readSmtpResponse(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
	const decoder = new TextDecoder();
	let buffer = "";
	const deadline = Date.now() + 10000;
	while (Date.now() < deadline) {
		const { value, done } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		if (buffer.endsWith("\r\n")) {
			const lines = buffer.split("\r\n").filter((l) => l.length > 0);
			const last = lines[lines.length - 1];
			// Multi-line SMTP responses use "NNN-..." for continuation lines and "NNN ..." (space) for
			// the final one - only a line with a space after the code means the response is complete.
			if (last && /^\d{3} /.test(last)) break;
		}
	}
	if (!buffer) throw new Error("SMTP: no response (timed out)");
	return buffer;
}

export async function sendEmail(env: Env, opts: { to: string; subject: string; text: string }): Promise<void> {
	const host = env.SMTP_SERVER;
	const port = Number(env.SMTP_PORT || "587");
	const user = env.SENDER_EMAIL;
	const pass = env.APP_PASSWORD;
	if (!host || !user || !pass) throw new Error("SMTP not configured (SMTP_SERVER/SENDER_EMAIL/APP_PASSWORD)");

	const plainSocket = connect({ hostname: host, port }, { secureTransport: "starttls", allowHalfOpen: false });
	let writer = plainSocket.writable.getWriter();
	let reader = plainSocket.readable.getReader();
	const enc = new TextEncoder();
	let send = (line: string) => writer.write(enc.encode(line + "\r\n"));

	try {
		await readSmtpResponse(reader); // 220 greeting
		await send(`EHLO keongyu-api.wolddream.workers.dev`);
		await readSmtpResponse(reader);
		await send("STARTTLS");
		const startTlsResp = await readSmtpResponse(reader);
		if (!startTlsResp.startsWith("220")) throw new Error("STARTTLS rejected: " + startTlsResp);

		writer.releaseLock();
		reader.releaseLock();
		const secureSocket = plainSocket.startTls();
		writer = secureSocket.writable.getWriter();
		reader = secureSocket.readable.getReader();
		send = (line: string) => writer.write(enc.encode(line + "\r\n"));

		await send(`EHLO keongyu-api.wolddream.workers.dev`);
		await readSmtpResponse(reader);
		await send("AUTH LOGIN");
		await readSmtpResponse(reader);
		await send(btoa(user));
		await readSmtpResponse(reader);
		await send(btoa(pass));
		const authResp = await readSmtpResponse(reader);
		if (!authResp.startsWith("235")) throw new Error("SMTP auth failed: " + authResp);

		await send(`MAIL FROM:<${user}>`);
		await readSmtpResponse(reader);
		await send(`RCPT TO:<${opts.to}>`);
		const rcptResp = await readSmtpResponse(reader);
		if (!rcptResp.startsWith("250")) throw new Error("RCPT rejected: " + rcptResp);
		await send("DATA");
		const dataStart = await readSmtpResponse(reader);
		if (!dataStart.startsWith("354")) throw new Error("DATA rejected: " + dataStart);

		const headers = [
			`From: =?UTF-8?B?${utf8ToBase64("경유(KEONGYU)")}?= <${user}>`,
			`To: ${opts.to}`,
			`Subject: =?UTF-8?B?${utf8ToBase64(opts.subject)}?=`,
			`MIME-Version: 1.0`,
			`Content-Type: text/plain; charset=utf-8`,
			`Content-Transfer-Encoding: 8bit`,
		].join("\r\n");
		const body = dotStuff(opts.text.replace(/\r?\n/g, "\r\n"));
		await send(`${headers}\r\n\r\n${body}\r\n.`);
		const dataResp = await readSmtpResponse(reader);
		if (!dataResp.startsWith("250")) throw new Error("Message rejected: " + dataResp);

		await send("QUIT");
		writer.releaseLock();
		reader.releaseLock();
		await secureSocket.close();
	} catch (err) {
		try {
			writer.releaseLock();
		} catch {}
		try {
			reader.releaseLock();
		} catch {}
		try {
			await plainSocket.close();
		} catch {}
		throw err;
	}
}
