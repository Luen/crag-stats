import { describe, expect, it } from 'vitest';
import {
	buildMonthlyStats,
	buildPartnerLeaderboard,
	buildRockTypeStats,
	buildStarsScatter,
	splitPartners,
	type DashboardExtraRow
} from './dashboardExtras';

describe('splitPartners', () => {
	it('splits on commas, and, semicolons, and strips @handles', () => {
		expect(splitPartners('@alice, Bob and carol;@dave')).toEqual(['alice', 'Bob', 'carol', 'dave']);
	});

	it('handles slash separators and empty input', () => {
		expect(splitPartners('Sam / @kim')).toEqual(['Sam', 'kim']);
		expect(splitPartners(null)).toEqual([]);
		expect(splitPartners('  ')).toEqual([]);
	});
});

describe('buildPartnerLeaderboard', () => {
	it('aggregates and ranks top partners', () => {
		const rows: DashboardExtraRow[] = [
			{ ascentDate: '2024-01-01', partners: '@alice, Bob' },
			{ ascentDate: '2024-01-02', partners: 'alice' },
			{ ascentDate: '2024-01-03', partners: 'Bob and @carol' },
			{ ascentDate: '2024-01-04', partners: 'Bob' }
		];
		const { partners } = buildPartnerLeaderboard(rows);
		expect(partners[0]?.name).toBe('Bob');
		expect(partners[0]?.count).toBe(3);
		expect(partners[0]?.ascents).toBe(3);
		expect(partners.find((p) => p.name === 'alice')?.count).toBe(2);
		expect(partners.find((p) => p.name === 'carol')?.count).toBe(1);
	});

	it('limits to top N by default and can return the full list', () => {
		const rows: DashboardExtraRow[] = [];
		for (let i = 0; i < 10; i++) {
			rows.push({ ascentDate: '2024-01-01', partners: `Partner ${i}` });
		}
		expect(buildPartnerLeaderboard(rows).partners).toHaveLength(7);
		expect(buildPartnerLeaderboard(rows, null).partners).toHaveLength(10);
	});
});

describe('buildRockTypeStats', () => {
	it('counts Rock type tags and reports dominant share', () => {
		const rows: DashboardExtraRow[] = [
			{
				ascentDate: '2024-01-01',
				tagsJson: JSON.stringify([
					{ category: 'Rock type', name: 'Granite' },
					{ category: 'Style', name: 'Crack' }
				])
			},
			{
				ascentDate: '2024-01-02',
				tagsJson: JSON.stringify([{ category: 'rock type', name: 'Granite' }])
			},
			{
				ascentDate: '2024-01-03',
				tagsJson: JSON.stringify([{ category: 'Rock type', name: 'Sandstone' }])
			},
			{ ascentDate: '2024-01-04', tagsJson: null }
		];
		const { types, dominant, dominantPct } = buildRockTypeStats(rows);
		expect(dominant).toBe('Granite');
		expect(dominantPct).toBe(66.7);
		expect(types).toEqual([
			{ name: 'Granite', count: 2, pct: 66.7 },
			{ name: 'Sandstone', count: 1, pct: 33.3 }
		]);
	});
});

describe('buildStarsScatter', () => {
	it('includes sends with qualityScore even when stars are missing', () => {
		const { points } = buildStarsScatter([
			{
				ascentDate: '2024-01-01',
				isSend: true,
				gradeScore: 22,
				qualityScore: 91,
				routeName: 'Test Route'
			}
		]);
		expect(points).toHaveLength(1);
		expect(points[0].qualityScore).toBe(91);
		expect(points[0].stars).toBeNull();
	});
});

describe('buildMonthlyStats', () => {
	it('buckets by YYYY-MM with style and height', () => {
		const rows: DashboardExtraRow[] = [
			{
				ascentDate: '2024-03-01',
				gearStyle: 'Sport',
				isSend: true,
				heightM: 20
			},
			{
				ascentDate: '2024-03-15',
				gearStyle: 'Trad',
				isSend: false,
				heightM: 30
			},
			{
				ascentDate: '2025-01-02',
				gearStyle: 'Boulder',
				isSend: true,
				heightM: 4
			},
			{ ascentDate: null, gearStyle: 'Sport', isSend: true, heightM: 99 }
		];
		const { months, years } = buildMonthlyStats(rows);
		expect(years).toEqual([2024, 2025]);
		expect(months).toHaveLength(2);
		expect(months[0]).toMatchObject({
			month: '2024-03',
			ascents: 2,
			sends: 1,
			heightM: 50,
			byStyle: { Sport: 1, Trad: 1 }
		});
		expect(months[1]).toMatchObject({
			month: '2025-01',
			ascents: 1,
			sends: 1,
			heightM: 4,
			byStyle: { Boulder: 1 }
		});
	});
});
