import { describe, expect, it } from 'vitest';
import { rankAlmostBadges } from './badgeProgress';

describe('rankAlmostBadges', () => {
	it('ranks by percent complete and caps the list', () => {
		const almost = rankAlmostBadges(
			[
				{ id: 'sends_100', title: 'Hundred', current: 40, target: 100 },
				{ id: 'sends_50', title: 'Fifty', current: 40, target: 50 },
				{ id: 'ascents_100', title: 'Century', current: 10, target: 100 },
				{ id: 'sends_25', title: 'Done', current: 25, target: 25 }
			],
			{ limit: 2 }
		);
		expect(almost.map((a) => a.id)).toEqual(['sends_50', 'sends_100']);
		expect(almost[0]?.pct).toBe(80);
		expect(almost.every((a) => a.pct < 100)).toBe(true);
	});

	it('skips zero progress and invalid targets', () => {
		expect(
			rankAlmostBadges([
				{ id: 'a', title: 'A', current: 0, target: 10 },
				{ id: 'b', title: 'B', current: 5, target: 0 }
			])
		).toEqual([]);
	});
});
