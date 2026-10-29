import { describe, expect, it } from 'vitest';
import {
	parseRouteBeta,
	parseRouteInfoFields,
	parseRoutePayload,
	parseRetryAfter,
	readRouteResponse,
	RouteHistoryBlockedError
} from './routeHistoryApi';

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

describe('parseRoutePayload route info', () => {
	it('parses flags, quality, popularity, seasonality, beta, ancestors, and pitches', () => {
		const routes = parseRoutePayload({
			data: [
				{
					id: 42,
					name: 'Test Line',
					urlAncestorStub: 'australia/queensland',
					flags: ['Project', 'IsSport'],
					qualityScore: 87.5,
					ascentCount: 120,
					popularity: 65,
					relativePopularity: 12.3,
					seasonality: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
					beta: {
						description: 'A fine line.',
						accessIssues: 'Closed when wet.',
						comment: 'private note must not appear'
					},
					ancestors: [{ id: 1, name: 'World' }],
					pitches: [{ number: 1, grade: '20' }],
					history: []
				}
			]
		});
		expect(routes).toHaveLength(1);
		const info = routes[0].info!;
		expect(info.isProject).toBe(1);
		expect(info.qualityScore).toBe(87.5);
		expect(info.ascentCount).toBe(120);
		expect(info.popularity).toBe(65);
		expect(info.relativePopularity).toBe(12.3);
		expect(JSON.parse(info.seasonalityJson!)).toHaveLength(12);
		expect(JSON.parse(info.flagsJson!)).toEqual(['Project', 'IsSport']);
		const beta = JSON.parse(info.betaJson!);
		expect(beta.description).toBe('A fine line.');
		expect(beta.accessIssues).toBe('Closed when wet.');
		expect(beta.comment).toBeUndefined();
		expect(beta.attributionUrl).toContain('/route/42');
		expect(JSON.parse(info.ancestorsJson!)).toEqual([{ id: 1, name: 'World' }]);
		expect(JSON.parse(info.pitchesJson!)).toEqual([{ number: 1, grade: '20' }]);
		const raw = JSON.parse(routes[0].rawJson!);
		expect(raw.id).toBe(42);
		expect(raw.beta.comment).toBe('private note must not appear');
		expect(raw.history).toEqual([]);
	});

	it('marks non-project when flags omit Project', () => {
		const info = parseRouteInfoFields({ flags: ['IsTrad'], id: '9' }, '9');
		expect(info?.isProject).toBe(0);
	});

	it('ignores invalid seasonality', () => {
		const info = parseRouteInfoFields({ seasonality: [1, 2, 3], id: '1' }, '1');
		expect(info?.seasonalityJson).toBeUndefined();
	});
});

describe('parseRouteBeta', () => {
	it('stores string beta with attribution only', () => {
		const json = parseRouteBeta('Short public text.', '99', 'australia/test');
		const o = JSON.parse(json!);
		expect(o.description).toBe('Short public text.');
		expect(o.attributionUrl).toMatch(/route\/99$/);
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

describe('explicitly cleared route info (#128)', () => {
	it('distinguishes nulls from omitted fields', () => {
		expect(parseRouteInfoFields({}, '1')).toBeUndefined();
		expect(
			parseRouteInfoFields(
				{
					beta: null,
					qualityScore: null,
					ascentCount: null,
					popularity: null,
					relativePopularity: null,
					seasonality: null,
					ancestors: null,
					pitches: null,
					flags: null
				},
				'1'
			)
		).toEqual({
			betaJson: null,
			qualityScore: null,
			ascentCount: null,
			popularity: null,
			relativePopularity: null,
			seasonalityJson: null,
			ancestorsJson: null,
			pitchesJson: null,
			flagsJson: null,
			isProject: null
		});
	});
});
