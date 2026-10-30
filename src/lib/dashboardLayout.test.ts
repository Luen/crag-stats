import { describe, expect, it } from 'vitest';
import {
	defaultLayout,
	normalizeLayout,
	packLayoutRows,
	parseLayoutCookie,
	serializeLayout,
	moveLayoutItem,
	resolveDashLayout
} from './dashboardLayout';

describe('dashboardLayout', () => {
	it('defaults to all enabled in catalog order', () => {
		const d = defaultLayout();
		expect(d.length).toBeGreaterThan(10);
		expect(d.every((i) => i.enabled)).toBe(true);
		expect(d[0]?.id).toBe('climberType');
		// Dreeve-style hero pair: recent activities left, climbing story right (#235).
		expect(d.slice(0, 3).map((i) => i.id)).toEqual(['climberType', 'recent', 'blurb']);
		expect(d.slice(3, 7).map((i) => i.id)).toEqual([
			'badges',
			'athleteProfile',
			'streaks',
			'eddington'
		]);
		const ids = d.map((i) => i.id);
		const monthly = ids.indexOf('monthly');
		const yearly = ids.indexOf('yearly');
		const sessions = ids.indexOf('sessionsPerWeek');
		const weekday = ids.indexOf('weekday');
		expect(yearly).toBe(monthly + 1);
		expect(weekday).toBe(yearly + 1);
		expect(sessions).toBe(weekday + 1);
	});

	it('round-trips cookie JSON and drops unknown ids', () => {
		const raw = serializeLayout([
			{ id: 'badges', enabled: true },
			{ id: 'heatmap', enabled: false }
		]);
		const parsed = parseLayoutCookie(raw);
		expect(parsed.find((i) => i.id === 'badges')?.enabled).toBe(true);
		expect(parsed.find((i) => i.id === 'heatmap')?.enabled).toBe(false);
		expect(parsed.find((i) => i.id === 'climberType')).toBeTruthy();
		expect(parseLayoutCookie('not-json')).toEqual(defaultLayout());
		expect(
			normalizeLayout([{ id: 'nope' as never, enabled: true }]).every(
				(i) => i.id !== ('nope' as never)
			)
		).toBe(true);
	});

	it('packs half and quarter widths into rows', () => {
		const rows = packLayoutRows([
			{ id: 'heatmap', enabled: true },
			{ id: 'streaks', enabled: true },
			{ id: 'athleteProfile', enabled: true },
			{ id: 'volume', enabled: true },
			{ id: 'gradeBands', enabled: true },
			{ id: 'topCrags', enabled: true },
			{ id: 'tickTypes', enabled: true },
			{ id: 'blurb', enabled: false }
		]);
		expect(rows[0]).toEqual({ kind: 'full', id: 'heatmap' });
		expect(rows[1]).toEqual({ kind: 'duo', ids: ['streaks', 'athleteProfile'] });
		expect(rows[2]?.kind).toBe('grid');
		if (rows[2]?.kind === 'grid') expect(rows[2].ids).toHaveLength(4);
	});

	it('moves items', () => {
		const base = [
			{ id: 'heatmap' as const, enabled: true },
			{ id: 'badges' as const, enabled: true }
		];
		const down = moveLayoutItem(normalizeLayout(base), 'heatmap', 1);
		expect(down[0]?.id).toBe('badges');
	});
});

describe('resolveDashLayout', () => {
	it('prefers the site-wide stored layout over the legacy cookie', () => {
		const stored = defaultLayout().map((item, i) => ({ ...item, enabled: i !== 0 }));
		const cookie = defaultLayout().map((item, i) => ({ ...item, enabled: i !== 1 }));
		const out = resolveDashLayout(serializeLayout(stored), serializeLayout(cookie));
		expect(out[0].enabled).toBe(false);
		expect(out[1].enabled).toBe(true);
	});

	it('round-trips through serialize/parse', () => {
		const layout = defaultLayout().map((item, i) => ({ ...item, enabled: i % 2 === 0 }));
		expect(resolveDashLayout(serializeLayout(layout))).toEqual(normalizeLayout(layout));
	});

	it('falls back to the cookie, then the default', () => {
		const cookie = defaultLayout().map((item, i) => ({ ...item, enabled: i !== 2 }));
		expect(resolveDashLayout(null, serializeLayout(cookie))[2].enabled).toBe(false);
		expect(resolveDashLayout(null, null)).toEqual(defaultLayout());
	});
});
