import { describe, expect, it } from 'vitest';
import { buildSoloStats, soloKind, type SoloRow } from './solo';

const row = (p: Partial<SoloRow>): SoloRow => ({
	tickType: 'Red point',
	ascentGearStyle: null,
	isSend: true,
	partners: 'Alex',
	date: '2024-01-01',
	routeName: 'Route',
	score: 18,
	isBoulder: false,
	gradeLabel: '18',
	band: 2,
	url: null,
	...p
});

describe('soloKind', () => {
	it('follows theCrag tick types and climbed gear style', () => {
		expect(soloKind({ tickType: 'Roped Solo', ascentGearStyle: null })).toBe('toprope');
		expect(soloKind({ tickType: 'Lead solo', ascentGearStyle: null })).toBe('lead');
		expect(soloKind({ tickType: 'Aid solo', ascentGearStyle: null })).toBe('aid');
		expect(soloKind({ tickType: 'Onsight', ascentGearStyle: 'solo' })).toBe('free');
		expect(soloKind({ tickType: 'Red point', ascentGearStyle: 'Free solo' })).toBe('free');
		expect(soloKind({ tickType: 'Onsight', ascentGearStyle: 'dws' })).toBe('dws');
		expect(soloKind({ tickType: 'Onsight', ascentGearStyle: 'sport' })).toBeNull();
		expect(soloKind({ tickType: 'Onsight', ascentGearStyle: null })).toBeNull();
	});
});

describe('buildSoloStats', () => {
	it('groups by kind in a fixed order with sends, years and hardest send', () => {
		const s = buildSoloStats([
			row({
				tickType: 'Onsight',
				ascentGearStyle: 'solo',
				score: 14,
				gradeLabel: '14',
				date: '2019-02-01'
			}),
			row({
				tickType: 'Onsight',
				ascentGearStyle: 'solo',
				score: 17,
				gradeLabel: '17',
				date: '2023-02-01'
			}),
			row({
				tickType: 'Attempt',
				ascentGearStyle: 'solo',
				isSend: false,
				score: 25,
				gradeLabel: '25'
			}),
			row({ tickType: 'Roped Solo', partners: null, score: 22, gradeLabel: '22' }),
			row({ tickType: 'Red point' }) // not a solo
		]);
		expect(s.total).toBe(4);
		expect(s.kinds.map((k) => [k.kind, k.count, k.sends])).toEqual([
			['toprope', 1, 1],
			['free', 3, 2]
		]);
		const free = s.kinds.find((k) => k.kind === 'free')!;
		// The unsent 25 isn't a send, so the hardest is the 17.
		expect(free.hardest?.gradeLabel).toBe('17');
		expect([free.first, free.latest]).toEqual(['2019-02-01', '2024-01-01']);
	});

	it('never compares boulders with routes for the hardest send', () => {
		const s = buildSoloStats([
			row({ ascentGearStyle: 'solo', score: 8, isBoulder: true, gradeLabel: 'V8' }),
			row({ ascentGearStyle: 'solo', score: 12, gradeLabel: '12' })
		]);
		expect(s.kinds[0].hardest?.gradeLabel).toBe('12');
	});

	it('counts ascents and sends with no partner tagged', () => {
		const s = buildSoloStats([
			row({ partners: null }),
			row({ partners: '  ', isSend: false }),
			row({ partners: 'Sam' })
		]);
		expect([s.unpartnered, s.unpartneredSends, s.totalAscents]).toEqual([2, 1, 3]);
		expect(s.total).toBe(0);
	});
});
