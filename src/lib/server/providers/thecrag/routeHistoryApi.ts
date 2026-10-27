/**
 * Fetch route history from theCrag's `/api/route/ids?show=info` (opt-in, ROUTE_HISTORY_IMPORT).
 *
 * Plain Node `fetch` is blocked by Cloudflare on these paths (the logbook API is not), so this
 * uses `impers`, which presents a browser-like TLS/HTTP2 fingerprint. It is loaded lazily, only
 * when the import is enabled. One session per import run. The engine
 * (`routeHistoryEngine.ts`) owns pacing (≥1 s between requests) and back-off; this client
 * never retries. Prefer negotiating proper route API access with theCrag.
 */
import { normalizeHistoryEntries, type RouteHistoryEntry } from './routeHistoryParse';

const ROUTE_IDS = 'https://www.thecrag.com/api/route/ids';

export type RouteWithHistory = {
	id: string;
	name: string | null;
	history: RouteHistoryEntry[];
};

/** One import run's connection to theCrag; `close()` it when the run ends. */
export type RouteHistoryClient = {
	fetchRoutes: (routeIds: readonly string[]) => Promise<RouteWithHistory[]>;
	close: () => Promise<void>;
};

/** impers (or its native library) could not load on this platform. */
export class RouteHistoryUnavailableError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'RouteHistoryUnavailableError';
	}
}

/** theCrag or Cloudflare refused or throttled us: stop the run and back off, don't retry. */
export class RouteHistoryBlockedError extends Error {
	readonly retryAfterSeconds: number | null;
	constructor(message: string, retryAfterSeconds: number | null = null) {
		super(message);
		this.name = 'RouteHistoryBlockedError';
		this.retryAfterSeconds = retryAfterSeconds;
	}
}

type ImpersResponse = { status: number; text: string; headers?: unknown };
type ImpersSession = {
	get: (
		url: string,
		opts?: { headers?: Record<string, string>; timeout?: number }
	) => Promise<ImpersResponse>;
	close: () => Promise<void>;
};

function header(res: ImpersResponse, name: string): string | null {
	const h = res.headers as
		| { get?: (n: string) => string | null }
		| Record<string, string | string[] | undefined>
		| undefined;
	if (!h) return null;
	if (typeof (h as { get?: unknown }).get === 'function') {
		return (h as { get: (n: string) => string | null }).get(name);
	}
	const v = (h as Record<string, string | string[] | undefined>)[name.toLowerCase()];
	return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

/** Retry-After as seconds (delta or HTTP date); null when absent or unparseable. */
export function parseRetryAfter(value: string | null, now = Date.now()): number | null {
	if (!value) return null;
	const n = Number(value.trim());
	if (Number.isFinite(n) && n >= 0) return Math.ceil(n);
	const t = Date.parse(value);
	return Number.isFinite(t) ? Math.max(0, Math.ceil((t - now) / 1000)) : null;
}

export function parseRoutePayload(json: unknown): RouteWithHistory[] {
	if (!json || typeof json !== 'object') return [];
	const root = json as { data?: unknown; error?: unknown; errorLabel?: unknown };
	if (root.error || root.errorLabel) {
		throw new Error(
			String(root.error ?? root.errorLabel ?? 'theCrag route API error').slice(0, 300)
		);
	}
	const data = root.data;
	const list: unknown[] = Array.isArray(data)
		? data
		: data && typeof data === 'object'
			? Object.values(data as Record<string, unknown>)
			: [];
	const out: RouteWithHistory[] = [];
	for (const item of list) {
		if (!item || typeof item !== 'object') continue;
		const o = item as Record<string, unknown>;
		if (o.id == null) continue;
		out.push({
			id: String(o.id),
			name: o.name != null ? String(o.name) : null,
			history: normalizeHistoryEntries(o.history)
		});
	}
	return out;
}

/** Interpret one response: blocks and throttling become RouteHistoryBlockedError. */
export function readRouteResponse(res: ImpersResponse): RouteWithHistory[] {
	const retryAfter = parseRetryAfter(header(res, 'retry-after'));
	const challenge = /sorry, you have been blocked|just a moment|attention required/i.test(res.text);
	if (res.status === 429 || res.status === 503 || (res.status === 403 && challenge)) {
		throw new RouteHistoryBlockedError(
			res.status === 429
				? 'theCrag asked us to slow down (429).'
				: `theCrag/Cloudflare refused the route API request (${res.status}).`,
			retryAfter
		);
	}
	if (res.status < 200 || res.status >= 300) {
		throw new Error(
			`theCrag route API ${res.status}: ${res.text.replace(/\s+/g, ' ').slice(0, 200)}`
		);
	}
	let json: unknown;
	try {
		json = JSON.parse(res.text);
	} catch {
		// A 200 with HTML is a challenge page in disguise: treat as a block, not a parse bug.
		throw new RouteHistoryBlockedError('Route API returned a non-JSON page (likely a challenge).');
	}
	return parseRoutePayload(json);
}

/** Open the run's single impers session. */
export async function openRouteHistoryClient(apiKey: string): Promise<RouteHistoryClient> {
	let session: ImpersSession;
	try {
		const impers = await import('impers');
		const Session = impers.Session;
		if (!Session) throw new Error('impers.Session is missing');
		session = new Session({
			impersonate: 'chrome',
			timeout: 45,
			headers: { Accept: 'application/json' }
		}) as ImpersSession;
	} catch (err) {
		throw new RouteHistoryUnavailableError(
			'Route history import needs impers (and its native libcurl), which failed to load on ' +
				'this platform. Manual FA/FFA marks still work.',
			{ cause: err }
		);
	}

	return {
		async fetchRoutes(routeIds) {
			const ids = [...new Set(routeIds.map(String).filter(Boolean))];
			if (!ids.length) return [];
			const url = new URL(ROUTE_IDS);
			url.searchParams.set('id', ids.join(','));
			url.searchParams.set('show', 'info');
			const res = await session.get(url.toString(), {
				headers: { Accept: 'application/json', 'X-CData-Key': `key=${apiKey}` },
				timeout: 45
			});
			return readRouteResponse(res);
		},
		async close() {
			await session.close().catch(() => undefined);
		}
	};
}
