/**
 * Fetch route history from theCrag's `/api/route/ids?show=info,ancestors` (opt-in, ROUTE_HISTORY_IMPORT).
 *
 * Plain Node `fetch` is blocked by Cloudflare on these paths (the logbook API is not), so this
 * uses `impers`, which presents a browser-like TLS/HTTP2 fingerprint. It is loaded lazily, only
 * when the import is enabled. One session per import run. The engine
 * (`routeHistoryEngine.ts`) owns pacing (≥1 s between requests) and back-off; this client
 * never retries. Prefer negotiating proper route API access with theCrag.
 */
import { theCragRouteUrl } from '#lib/thecragUrls';
import { normalizeHistoryEntries, type RouteHistoryEntry } from './routeHistoryParse';

const ROUTE_IDS = 'https://www.thecrag.com/api/route/ids';

/** Route-level fields parsed from `/api/route` (cached on `routes`, #77–#82). */
export type RouteInfoFields = {
	isProject?: 0 | 1 | null;
	qualityScore?: number | null;
	ascentCount?: number | null;
	popularity?: number | null;
	relativePopularity?: number | null;
	seasonalityJson?: string | null;
	betaJson?: string | null;
	ancestorsJson?: string | null;
	pitchesJson?: string | null;
	flagsJson?: string | null;
};

export type RouteWithHistory = {
	id: string;
	name: string | null;
	history: RouteHistoryEntry[];
	info?: RouteInfoFields;
	/** Full route object from the API response (JSON string); null/omit when tests stub without it. */
	rawJson?: string | null;
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

function finiteNumber(v: unknown): number | undefined {
	if (typeof v === 'number' && Number.isFinite(v)) return v;
	if (typeof v === 'string' && v.trim() !== '') {
		const n = Number(v);
		if (Number.isFinite(n)) return n;
	}
	return undefined;
}

function finiteInt(v: unknown): number | undefined {
	const n = finiteNumber(v);
	if (n === undefined) return undefined;
	return Math.trunc(n);
}

function jsonColumn(v: unknown): string | undefined {
	if (v === undefined) return undefined;
	try {
		return JSON.stringify(v);
	} catch {
		return undefined;
	}
}

const BETA_TEXT_KEYS = [
	'description',
	'accessIssues',
	'access',
	'ethic',
	'ethics',
	'approach'
] as const;

const BETA_EXCERPT_MAX = 4000;

function betaExcerpt(text: string): string {
	const t = text.trim();
	if (t.length <= BETA_EXCERPT_MAX) return t;
	return `${t.slice(0, BETA_EXCERPT_MAX)}…`;
}

/** Public guidebook beta only — never ascent notes or private fields. */
export function parseRouteBeta(
	beta: unknown,
	routeId: string,
	urlAncestorStub?: unknown
): string | null | undefined {
	if (beta === undefined) return undefined;
	if (beta === null) return null;
	const out: Record<string, string> = {};
	if (typeof beta === 'object' && !Array.isArray(beta)) {
		const b = beta as Record<string, unknown>;
		for (const key of BETA_TEXT_KEYS) {
			const v = b[key];
			if (typeof v === 'string' && v.trim()) out[key] = betaExcerpt(v);
		}
	} else if (typeof beta === 'string' && beta.trim()) {
		out.description = betaExcerpt(beta);
	}
	const stub = typeof urlAncestorStub === 'string' ? urlAncestorStub : null;
	const attributionUrl = theCragRouteUrl(routeId, stub);
	if (attributionUrl) out.attributionUrl = attributionUrl;
	if (!Object.keys(out).length) return undefined;
	return JSON.stringify(out);
}

function parseSeasonalityJson(v: unknown): string | undefined {
	if (!Array.isArray(v) || v.length !== 12) return undefined;
	const nums: number[] = [];
	for (const item of v) {
		const n = finiteNumber(item);
		if (n === undefined) return undefined;
		nums.push(n);
	}
	return JSON.stringify(nums);
}

function normalizeFlagList(flags: unknown): string[] | undefined {
	if (!Array.isArray(flags)) return undefined;
	return flags.map((f) => String(f));
}

function isProjectFromFlags(flags: unknown): 0 | 1 | undefined {
	const list = normalizeFlagList(flags);
	if (!list) return undefined;
	return list.some((f) => /^project$/i.test(f.trim())) ? 1 : 0;
}

/** Extract cacheable route fields when the API includes them. */
export function parseRouteInfoFields(
	o: Record<string, unknown>,
	routeId: string
): RouteInfoFields | undefined {
	const info: RouteInfoFields = {};
	const isProject = isProjectFromFlags(o.flags);
	if (o.flags === null) info.isProject = null;
	else if (isProject !== undefined) info.isProject = isProject;

	const qualityScore = finiteNumber(o.qualityScore);
	if (o.qualityScore === null) info.qualityScore = null;
	else if (qualityScore !== undefined) info.qualityScore = qualityScore;

	const ascentCount = finiteInt(o.ascentCount);
	if (o.ascentCount === null) info.ascentCount = null;
	else if (ascentCount !== undefined) info.ascentCount = ascentCount;

	const popularity = finiteNumber(o.popularity);
	if (o.popularity === null) info.popularity = null;
	else if (popularity !== undefined) info.popularity = popularity;

	const relativePopularity = finiteNumber(o.relativePopularity);
	if (o.relativePopularity === null) info.relativePopularity = null;
	else if (relativePopularity !== undefined) info.relativePopularity = relativePopularity;

	const seasonalityJson = parseSeasonalityJson(o.seasonality);
	if (o.seasonality === null) info.seasonalityJson = null;
	else if (seasonalityJson !== undefined) info.seasonalityJson = seasonalityJson;

	const betaJson = parseRouteBeta(o.beta, routeId, o.urlAncestorStub);
	if (betaJson !== undefined) info.betaJson = betaJson;

	if (o.ancestors !== undefined) {
		const ancestorsJson = jsonColumn(o.ancestors);
		if (ancestorsJson !== undefined)
			info.ancestorsJson = o.ancestors === null ? null : ancestorsJson;
	}
	if (o.pitches !== undefined) {
		const pitchesJson = jsonColumn(o.pitches);
		if (pitchesJson !== undefined) info.pitchesJson = o.pitches === null ? null : pitchesJson;
	}
	if (o.flags !== undefined) {
		const flagsJson = jsonColumn(o.flags);
		if (flagsJson !== undefined) info.flagsJson = o.flags === null ? null : flagsJson;
	}

	return Object.keys(info).length ? info : undefined;
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
		const id = String(o.id);
		const info = parseRouteInfoFields(o, id);
		out.push({
			id,
			name: o.name != null ? String(o.name) : null,
			history: normalizeHistoryEntries(o.history),
			rawJson: jsonColumn(o) ?? null,
			...(info ? { info } : {})
		});
	}
	return out;
}

function looksLikeChallengePage(text: string): boolean {
	return (
		/sorry, you have been blocked|just a moment|attention required|cf-browser-verification|cloudflare/i.test(
			text
		) || /^\s*</.test(text)
	);
}

/** Interpret one response: blocks and throttling become RouteHistoryBlockedError. */
export function readRouteResponse(res: ImpersResponse): RouteWithHistory[] {
	const retryAfter = parseRetryAfter(header(res, 'retry-after'));
	const challenge = looksLikeChallengePage(res.text);
	// Any 403, plus 429/503, plus other 4xx/5xx that look like CF/HTML — long block backoff.
	// A bare 403 without the usual challenge copy still means "go away", not a 1 h soft error.
	if (
		res.status === 429 ||
		res.status === 503 ||
		res.status === 403 ||
		(res.status >= 400 && challenge)
	) {
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
			url.searchParams.set('show', 'info,ancestors');
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
