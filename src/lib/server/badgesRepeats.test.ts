import { describe, expect, it } from 'vitest';
import { BADGE_CATALOG, buildBadges } from './badges';
import type { DashboardExtraRow } from './dashboardExtras';

function day(offset: number): string {
	return new Date(Date.UTC(2024, 0, 1 + offset)).toISOString().slice(0, 10);
}

function ascent(
	key: string | null,
	date: string,
	extra: Partial<DashboardExtraRow> = {}
): DashboardExtraRow {
	return {
		ascentDate: date,
		routeKey: key,
		routeName: `Route ${key}`,
		cragName: 'Home Crag',
		isSend: false,
		tickType: 'Attempt',
		...extra
	};
}

const byId = (rows: DashboardExtraRow[], id: string) =>
	buildBadges(rows).earned.find((b) => b.id === id);

describe('repeats vs new routes badges', () => {
	it('lists each badge once in the catalog with a stable id', () => {
		for (const id of [
			'distinct_routes_50',
			'distinct_routes_100',
			'distinct_routes_250',
			'distinct_routes_500',
			'route_days_10',
			'home_turf_25'
		]) {
			expect(BADGE_CATALOG.filter((b) => b.id === id)).toHaveLength(1);
		}
		expect(BADGE_CATALOG.find((b) => b.id === 'distinct_routes_50')?.title).toBe('Explorer');
		expect(BADGE_CATALOG.find((b) => b.id === 'route_days_10')?.title).toBe('Old Faithful');
		expect(BADGE_CATALOG.find((b) => b.id === 'home_turf_25')?.title).toBe('Home Turf');
	});

	it('dates Explorer by the 50th different route, counting attempts', () => {
		const rows = Array.from({ length: 50 }, (_, i) => ascent(`thecrag:${i}`, day(i)));
		rows.push(ascent('thecrag:0', day(60))); // a repeat never counts as a new route
		const hit = byId(rows, 'distinct_routes_50');
		expect(hit?.date).toBe(day(49));
		expect(hit?.detail).toMatch(/Different route #50/);
		expect(byId(rows.slice(0, 49), 'distinct_routes_50')).toBeUndefined();
	});

	it('keys routes by provider id, not name, and skips rows without a key', () => {
		const sameName = Array.from({ length: 50 }, (_, i) =>
			ascent(`thecrag:${i}`, day(i), { routeName: 'Same Name' })
		);
		expect(byId(sameName, 'distinct_routes_50')).toBeDefined();
		const unkeyed = Array.from({ length: 50 }, (_, i) => ascent(null, day(i)));
		expect(byId(unkeyed, 'distinct_routes_50')).toBeUndefined();
	});

	it('awards Old Faithful on the tenth different day on one route', () => {
		const rows: DashboardExtraRow[] = [];
		for (let i = 0; i < 10; i++) {
			rows.push(ascent('thecrag:7', day(i * 7), { ascentId: i * 2 }));
			rows.push(ascent('thecrag:7', day(i * 7), { ascentId: i * 2 + 1 })); // same day twice
		}
		const hit = byId(rows, 'route_days_10');
		expect(hit?.date).toBe(day(63));
		expect(byId(rows.slice(0, 18), 'route_days_10')).toBeUndefined();
	});

	it('awards Home Turf for 25 repeat ascents at one crag', () => {
		const rows: DashboardExtraRow[] = [];
		// First visits at the home crag never count as repeats.
		for (let r = 0; r < 5; r++) rows.push(ascent(`thecrag:${r}`, day(0)));
		// Repeat ascents elsewhere do not add to the home crag.
		rows.push(ascent('thecrag:99', day(0), { cragName: 'Away Crag' }));
		rows.push(ascent('thecrag:99', day(1), { cragName: 'Away Crag' }));
		for (let n = 0; n < 25; n++) rows.push(ascent(`thecrag:${n % 5}`, day(1 + n)));
		const hit = byId(rows, 'home_turf_25');
		expect(hit?.date).toBe(day(25));
		expect(hit?.detail).toMatch(/25 repeat ascents at Home Crag/);
		expect(byId(rows.slice(0, -1), 'home_turf_25')).toBeUndefined();
	});

	it('shows progress in Almost there until earned', () => {
		const rows = Array.from({ length: 45 }, (_, i) => ascent(`thecrag:${i}`, day(i)));
		const almost = buildBadges(rows).almost.map((a) => a.id);
		expect(almost).toContain('distinct_routes_50');
	});
});
