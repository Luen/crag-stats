/**
 * Fetch route history from theCrag's `/api/route` endpoints.
 *
 * Plain Node `fetch` is blocked by Cloudflare on these paths; the logbook API is not.
 * We use `impers` (curl-impersonate) so TLS/HTTP2 looks like Chrome. Fail soft if the
 * native library cannot load (unsupported arch, missing download, etc.).
 *
 * Prefer negotiating proper API access with theCrag when possible.
 */
import { normalizeHistoryEntries, type RouteHistoryEntry } from './routeHistoryParse';

const ROUTE_IDS = 'https://www.thecrag.com/api/route/ids';

export type RouteWithHistory = {
	id: string;
	name: string | null;
	history: RouteHistoryEntry[];
};

export class RouteHistoryUnavailableError extends Error {
	constructor(message: string, options?: { cause?: unknown }) {
		super(message, options);
		this.name = 'RouteHistoryUnavailableError';
	}
}

type ImpersSession = {
	get: (
		url: string,
		opts?: { headers?: Record<string, string>; timeout?: number }
	) => Promise<{ status: number; text: string }>;
	close: () => Promise<void>;
};

async function openSession(): Promise<ImpersSession> {
	try {
		const impers = await import('impers');
		const Session = impers.Session;
		if (!Session) {
			throw new Error('impers.Session is missing');
		}
		return new Session({
			impersonate: 'chrome',
			timeout: 45,
			headers: { Accept: 'application/json' }
		}) as ImpersSession;
	} catch (err) {
		throw new RouteHistoryUnavailableError(
			'Route history fetch needs impers (browser TLS impersonation) and it failed to load. ' +
				'Check Node/arch support for koffi + curl-impersonate, or ask theCrag for route API access.',
			{ cause: err }
		);
	}
}

function parseRoutePayload(json: unknown): RouteWithHistory[] {
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

/**
 * Batch-fetch route info (including `history` when present) via `?show=info`.
 * Caller owns rate limiting between batches.
 */
export async function fetchRoutesWithHistory(
	apiKey: string,
	routeIds: readonly string[]
): Promise<RouteWithHistory[]> {
	const ids = [...new Set(routeIds.map(String).filter(Boolean))];
	if (!ids.length) return [];

	const session = await openSession();
	try {
		const url = new URL(ROUTE_IDS);
		url.searchParams.set('id', ids.join(','));
		url.searchParams.set('show', 'info');

		const res = await session.get(url.toString(), {
			headers: {
				Accept: 'application/json',
				'X-CData-Key': `key=${apiKey}`
			},
			timeout: 45
		});

		if (res.status === 403 && /sorry, you have been blocked|just a moment/i.test(res.text)) {
			throw new RouteHistoryUnavailableError(
				'Cloudflare blocked the route API request even with browser impersonation.'
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
		} catch (err) {
			throw new RouteHistoryUnavailableError(
				'Route API returned non-JSON (likely a challenge page).',
				{ cause: err }
			);
		}
		return parseRoutePayload(json);
	} finally {
		await session.close().catch(() => undefined);
	}
}
