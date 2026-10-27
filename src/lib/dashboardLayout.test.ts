import { describe, expect, it } from 'vitest';
import {
	defaultLayout,
	normalizeLayout,
	packLayoutRows,
	parseLayoutCookie,
	serializeLayout,
	moveLayoutItem
} from './dashboardLayout';

describe('dashboardLayout', () => {
	it('defaults to all enabled in catalog order', () => {
		const d = defaultLayout();
		expect(d.length).toBeGreaterThan(10);
		expect(d.every((i) => i.enabled)).toBe(true);
		expect(d[0]?.id).toBe('climberType');
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
