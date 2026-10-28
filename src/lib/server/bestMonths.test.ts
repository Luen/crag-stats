import { describe, expect, it } from 'vitest';
import { buildBestMonthsView, parseSeasonalityJson } from './bestMonths';

const season = (peak: number) =>
	JSON.stringify(Array.from({ length: 12 }, (_, i) => (i === peak ? 10 : 1)));

describe('parseSeasonalityJson', () => {
	it('accepts 12 finite numbers', () => {
		expect(parseSeasonalityJson(season(5))).toEqual(JSON.parse(season(5)));
	});

	it('rejects wrong length or invalid JSON', () => {
		expect(parseSeasonalityJson('[1,2,3]')).toBeNull();
		expect(parseSeasonalityJson('not json')).toBeNull();
		expect(parseSeasonalityJson(null)).toBeNull();
	});
});

describe('buildBestMonthsView', () => {
	it('weights route seasonality by ascent count at that route', () => {
		const view = buildBestMonthsView([
			{
				cragName: 'Castle Hill',
				cragUrl: null,
				ascentDate: '2024-06-15',
				routeId: 1,
				seasonalityJson: season(5)
			},
			{
				cragName: 'Castle Hill',
				cragUrl: null,
				ascentDate: '2024-07-01',
				routeId: 1,
				seasonalityJson: season(5)
			},
			{
				cragName: 'Castle Hill',
				cragUrl: null,
				ascentDate: '2024-01-10',
				routeId: 2,
				seasonalityJson: season(0)
			}
		]);

		expect(view.cragCount).toBe(1);
		const c = view.crags[0];
		expect(c.peakMonth).toBe(5);
		expect(c.seasonality[5]).toBeGreaterThan(c.seasonality[0]);
		expect(c.yourMonths[5]).toBe(1);
		expect(c.yourMonths[6]).toBe(1);
		expect(c.yourMonths[0]).toBe(1);
	});

	it('omits crags with no seasonality on any climbed route', () => {
		const view = buildBestMonthsView([
			{
				cragName: 'Indoor Wall',
				cragUrl: null,
				ascentDate: '2024-03-01',
				routeId: 9,
				seasonalityJson: null
			}
		]);
		expect(view.cragCount).toBe(0);
		expect(view.crags).toEqual([]);
	});

	it('returns top crags by ascent count', () => {
		const rows = [];
		for (let i = 0; i < 8; i++) {
			rows.push({
				cragName: `Crag ${i}`,
				cragUrl: null,
				ascentDate: '2024-04-01',
				routeId: 100 + i,
				seasonalityJson: season(i % 12)
			});
		}
		rows.push(
			{
				cragName: 'Crag 0',
				cragUrl: null,
				ascentDate: '2024-05-01',
				routeId: 100,
				seasonalityJson: season(0)
			},
			{
				cragName: 'Crag 1',
				cragUrl: null,
				ascentDate: '2024-05-02',
				routeId: 101,
				seasonalityJson: season(1)
			}
		);
		const view = buildBestMonthsView(rows, 3);
		expect(view.crags).toHaveLength(3);
		expect(view.crags[0].crag).toBe('Crag 0');
		expect(view.crags[1].crag).toBe('Crag 1');
	});
});
