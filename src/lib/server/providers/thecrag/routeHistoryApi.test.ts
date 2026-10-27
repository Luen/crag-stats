import { describe, expect, it } from 'vitest';
import { parseRetryAfter, readRouteResponse, RouteHistoryBlockedError } from './routeHistoryApi';

const ok = (body: unknown) => ({ status: 200, text: JSON.stringify(body) });

describe('readRouteResponse', () => {
	it('reads routes and their history', () => {
		const routes = readRouteResponse(
			ok({
				data: [
					{ id: 1, name: 'A', history: [{ id: 7, type: 'First Ascent', climbers: '@x' }] },
					{ id: 2, name: 'B' }
				]
			})
		);
		expect(routes.map((r) => [r.id, r.history.length])).toEqual([
			['1', 1],
			['2', 0]
		]);
	});

	it('treats throttling, Cloudflare pages and HTML-as-200 as a block (no retry)', () => {
		const blocked = (res: { status: number; text: string; headers?: unknown }) => {
			try {
				readRouteResponse(res);
			} catch (e) {
				return e instanceof RouteHistoryBlockedError ? e : null;
			}
			return null;
		};
		expect(
			blocked({ status: 429, text: '', headers: { 'retry-after': '120' } })?.retryAfterSeconds
		).toBe(120);
		expect(blocked({ status: 403, text: '<h1>Sorry, you have been blocked</h1>' })).not.toBeNull();
		// Bare 403 without the usual copy still takes the long block backoff.
		expect(blocked({ status: 403, text: 'forbidden' })).not.toBeNull();
		expect(blocked({ status: 503, text: 'Just a moment...' })).not.toBeNull();
		expect(blocked({ status: 502, text: '<html>cloudflare</html>' })).not.toBeNull();
		expect(
			blocked({ status: 200, text: '<!DOCTYPE html><title>Just a moment</title>' })
		).not.toBeNull();
	});

	it('reports other failures as plain errors', () => {
		expect(() => readRouteResponse({ status: 500, text: 'oops' })).toThrow('theCrag route API 500');
		expect(() => readRouteResponse(ok({ error: 'insufficient access' }))).toThrow(
			'insufficient access'
		);
	});
});

describe('parseRetryAfter', () => {
	it('accepts seconds or an HTTP date', () => {
		expect(parseRetryAfter('30')).toBe(30);
		const now = Date.parse('2026-01-01T00:00:00Z');
		expect(parseRetryAfter('Thu, 01 Jan 2026 00:10:00 GMT', now)).toBe(600);
		expect(parseRetryAfter(null)).toBeNull();
		expect(parseRetryAfter('soon')).toBeNull();
	});
});
