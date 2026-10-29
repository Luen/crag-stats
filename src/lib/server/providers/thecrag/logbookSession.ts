/** Authenticated CSV export. No database/env imports: tests use a fake session and clock. */
import { parse } from 'csv-parse/sync';
import { brotliDecompressSync, gunzipSync, inflateSync } from 'node:zlib';
import { parseTheCragCsv } from './csv';
import type { CanonicalAscent } from '../types';

const ORIGIN = 'https://www.thecrag.com';
const REQUEST_GAP_MS = 1100;
const DAY = 86_400_000;

export type SavedCookie = {
	name: string;
	value: string;
	domain?: string;
	path?: string;
	expires?: string;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: 'Strict' | 'Lax' | 'None';
};
export type SavedSession = { cookies: SavedCookie[]; nextAllowedAt: number; failures: number };
export type LogbookSessionStore = {
	load: () => SavedSession;
	save: (state: SavedSession) => void;
};
export type WebResponse = {
	status: number;
	text: string;
	headers: { get: (name: string) => string | null };
};
export type WebSession = {
	request: (method: 'GET' | 'POST', url: string, data?: string) => Promise<WebResponse>;
	cookies: () => SavedCookie[];
	close: () => Promise<void>;
};
export type LogbookSessionDeps = {
	open: (cookies: SavedCookie[]) => Promise<WebSession>;
	now: () => number;
	sleep: (ms: number) => Promise<void>;
	/** Wipe/forget cancels outstanding downloads before they can save anything. */
	stillCurrent: () => boolean;
};

export class LogbookDownloadError extends Error {
	constructor(
		message: string,
		readonly retryMs = DAY
	) {
		super(message);
		this.name = 'LogbookDownloadError';
	}
}

function trustedUrl(value: string, base = ORIGIN): string {
	const url = new URL(value, base);
	if (url.origin !== ORIGIN || url.username || url.password) {
		throw new LogbookDownloadError(
			'theCrag redirected outside its HTTPS origin; download stopped.'
		);
	}
	return url.href;
}

function decodeAttribute(value: string): string {
	return value.replace(/&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt);/gi, (entity, key: string) => {
		if (key.startsWith('#')) {
			const code = key[1].toLowerCase() === 'x' ? parseInt(key.slice(2), 16) : Number(key.slice(1));
			return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
		}
		return ({ amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' } as Record<string, string>)[
			key.toLowerCase()
		];
	});
}

function attributes(tag: string): Record<string, string> {
	const result: Record<string, string> = Object.create(null);
	for (const m of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
		result[m[1].toLowerCase()] = decodeAttribute(m[2] ?? m[3] ?? m[4]);
	}
	return result;
}

/** Read fresh hidden controls; never use a CSRF token copied from the HAR. */
export function loginForm(html: string): { action: string; fields: URLSearchParams } {
	for (const match of html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form\s*>/gi)) {
		const inputs = [...match[0].matchAll(/<input\b[^>]*>/gi)].map((m) => attributes(m[0]));
		if (!inputs.some((i) => i.name === 'D:Password')) continue;
		const form = attributes(match[0].slice(0, match[0].indexOf('>') + 1));
		const action = trustedUrl(form.action || '');
		// theCrag historically used a double-slash path; accept the normalized single-slash form too.
		const loginPath = new URL(action).pathname.replace(/\/{2,}/g, '/');
		if (form.method?.toLowerCase() !== 'post' || loginPath !== '/CIDS/cgi-bin/cids.cgi') {
			throw new LogbookDownloadError('theCrag login form changed; automatic login stopped.');
		}
		const fields = new URLSearchParams();
		for (const input of inputs) {
			if (input.type?.toLowerCase() === 'hidden' && input.name)
				fields.set(input.name, input.value ?? '');
		}
		if (!fields.get('D:CSRF'))
			throw new LogbookDownloadError('theCrag login form has no CSRF token.');
		fields.set('State:Login', '');
		return { action, fields };
	}
	throw new LogbookDownloadError('theCrag login form was not found; automatic login stopped.');
}

function isLoginPage(response: WebResponse): boolean {
	// The export is deliberately 404 while logged out, rather than a login redirect.
	return (
		response.status === 401 ||
		(response.status === 404 && Boolean(response.headers.get('content-type')?.includes('html'))) ||
		/name\s*=\s*(?:["']D:Password["']|D:Password(?=\s|>))/i.test(response.text)
	);
}

function checkBlock(response: WebResponse, now: number) {
	const html =
		response.headers.get('content-type')?.includes('html') || /^\s*</.test(response.text);
	// Ordinary pages also contain Cloudflare's /challenge-platform/.../jsd script.
	if (
		[403, 429, 503].includes(response.status) ||
		(html &&
			/cf-chl-|cf-error-details|<title>\s*just a moment|<form[^>]+(?:captcha|challenge)/i.test(
				response.text
			))
	) {
		const retry = response.headers.get('retry-after');
		const seconds = retry && /^\d+$/.test(retry.trim()) ? Number(retry) : NaN;
		const retryMs = Number.isFinite(seconds) ? seconds * 1000 : retry ? Date.parse(retry) - now : 0;
		throw new LogbookDownloadError(
			'theCrag blocked or throttled the download; waiting before trying again.',
			Math.max(DAY, Number.isFinite(retryMs) ? retryMs : 0)
		);
	}
}

/** Strict validation before the existing permissive manual-import parser sees a download. */
export function parseDownloadedLogbook(response: WebResponse): CanonicalAscent[] {
	if (
		response.status !== 200 ||
		!/^text\/csv(?:;|$)/i.test(response.headers.get('content-type') ?? '')
	) {
		throw new LogbookDownloadError('theCrag did not return a CSV logbook export.');
	}
	try {
		const records = parse(response.text, { bom: true, skip_empty_lines: true }) as string[][];
		const header = records[0] ?? [];
		for (const name of ['Ascent ID', 'Route ID', 'Route Name', 'Ascent Date', 'Ascent Type']) {
			if (!header.includes(name)) throw new Error('header');
		}
		const rows = records.slice(1);
		const ascents = parseTheCragCsv(Buffer.from(response.text));
		if (
			ascents.length !== rows.length ||
			new Set(ascents.map((a) => a.externalId)).size !== rows.length
		)
			throw new Error('rows');
		return ascents;
	} catch {
		throw new LogbookDownloadError(
			'theCrag returned an invalid or incomplete CSV export; nothing was imported.'
		);
	}
}

/** One export attempt, at most one login, then one export retry. Never logs upstream data. */
export async function downloadLogbook(
	credentials: { username: string; password: string },
	store: LogbookSessionStore,
	deps: LogbookSessionDeps
): Promise<CanonicalAscent[]> {
	if (!/^(?!\.{1,2}$)[\w.-]+$/.test(credentials.username) || !credentials.password) {
		throw new LogbookDownloadError(
			'Set THECRAG_USERNAME to your username (not email) and THECRAG_PASSWORD.'
		);
	}
	const saved = store.load();
	if (saved.nextAllowedAt > deps.now())
		throw new LogbookDownloadError(
			'theCrag login/download is paused after a previous failure; try again later.'
		);
	let session: WebSession | undefined;
	let lastRequest = 0;
	const current = () => {
		if (!deps.stillCurrent())
			throw new LogbookDownloadError(
				'Logbook download cancelled because local data or the saved login was cleared.'
			);
	};
	const request = async (
		initial: string,
		method: 'GET' | 'POST' = 'GET',
		data?: string
	): Promise<WebResponse> => {
		let url = trustedUrl(initial);
		for (let hop = 0; hop <= 5; hop++) {
			current();
			const wait = lastRequest + REQUEST_GAP_MS - deps.now();
			if (wait > 0) await deps.sleep(wait);
			current();
			lastRequest = deps.now();
			const response = await session!.request(method, url, data);
			current();
			checkBlock(response, deps.now());
			if (![301, 302, 303, 307, 308].includes(response.status)) return response;
			const location = response.headers.get('location');
			if (!location || hop === 5 || (method === 'POST' && [307, 308].includes(response.status)))
				throw new LogbookDownloadError('theCrag login/export redirect was not safe to follow.');
			url = trustedUrl(location, url);
			method = 'GET';
			data = undefined;
		}
		throw new LogbookDownloadError('Too many theCrag redirects.');
	};
	try {
		current();
		session = await deps.open(saved.cookies);
		const exportUrl = `${ORIGIN}/climber/${encodeURIComponent(credentials.username)}/logbook-csv`;
		let response = await request(exportUrl);
		if (isLoginPage(response)) {
			const page = response.status === 200 ? response : await request(`${ORIGIN}/`);
			const { action, fields } = loginForm(page.text);
			fields.set('D:Login', credentials.username);
			fields.set('D:Password', credentials.password);
			// Fixed same-origin target rather than a hidden input's arbitrary return URL.
			fields.set('D:LoginTarget', `/climber/${encodeURIComponent(credentials.username)}`);
			const login = await request(action, 'POST', fields.toString());
			if (login.status !== 200 || isLoginPage(login))
				throw new LogbookDownloadError(
					'theCrag login failed. Check credentials or complete any verification on theCrag.'
				);
			response = await request(exportUrl);
			if (isLoginPage(response))
				throw new LogbookDownloadError('theCrag login did not authorize the logbook download.');
		}
		const ascents = parseDownloadedLogbook(response);
		current();
		store.save({ cookies: session.cookies(), nextAllowedAt: 0, failures: 0 });
		return ascents;
	} catch (err) {
		// Raw impers errors may contain request details. Only fixed, application-owned messages escape.
		const error =
			err instanceof LogbookDownloadError
				? err
				: new LogbookDownloadError(
						'theCrag logbook download failed (network or impers unavailable).'
					);
		if (deps.stillCurrent()) {
			const failures = saved.failures + 1;
			store.save({
				cookies: saved.cookies,
				failures,
				nextAllowedAt:
					deps.now() +
					Math.max(error.retryMs, Math.min(7 * DAY, DAY * 2 ** Math.min(failures - 1, 3)))
			});
		}
		throw error;
	} finally {
		await session?.close().catch(() => undefined);
	}
}

/** Lazy native client; cookies retain domain, path, security flags and absolute expiry. */
export async function openLogbookSession(cookies: SavedCookie[]): Promise<WebSession> {
	const { Session } = await import('impers');
	const session = new Session({
		impersonate: 'chrome',
		timeout: 45,
		allowRedirects: false,
		cookies: cookies.map((c) => ({ ...c, expires: c.expires ? new Date(c.expires) : undefined }))
	});
	return {
		async request(method, url, data) {
			const chunks: Buffer[] = [];
			const controller = new AbortController();
			let size = 0;
			const response = await session.request(method, trustedUrl(url), {
				data,
				signal: controller.signal,
				stream: true,
				acceptEncoding: 'identity',
				headers: {
					Accept: 'text/csv,text/html;q=0.9',
					...(method === 'POST'
						? {
								Origin: ORIGIN,
								Referer: `${ORIGIN}/`,
								'Content-Type': 'application/x-www-form-urlencoded'
							}
						: {})
				},
				contentCallback(chunk) {
					size += chunk.length;
					if (size > 64 * 1024 * 1024) controller.abort();
					else chunks.push(Buffer.from(chunk));
				}
			});
			// Reject even if the native client completes while an abort is being delivered.
			if (controller.signal.aborted) throw new Error('Logbook response exceeded size limit');
			let body = Buffer.concat(chunks);
			const encoding = response.headers.get('content-encoding')?.toLowerCase();
			const bounds = { maxOutputLength: 64 * 1024 * 1024 };
			if (encoding === 'gzip') body = gunzipSync(body, bounds);
			else if (encoding === 'br') body = brotliDecompressSync(body, bounds);
			else if (encoding === 'deflate') body = inflateSync(body, bounds);
			else if (encoding && encoding !== 'identity') throw new Error('Unsupported content encoding');
			return { status: response.status, headers: response.headers, text: body.toString('utf8') };
		},
		cookies: () =>
			[...session.cookies]
				.filter(
					(c) =>
						!c.domain ||
						['thecrag.com', 'www.thecrag.com'].includes(c.domain.replace(/^\./, '').toLowerCase())
				)
				.map((c) => ({ ...c, expires: c.expires?.toISOString() })),
		close: () => session.close()
	};
}
