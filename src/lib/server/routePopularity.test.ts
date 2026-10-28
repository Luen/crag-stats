import { describe, expect, it } from 'vitest';
import {
	buildRoutePopularityStats,
	gemQualityScore,
	POPULARITY_BUSY_THRESHOLD,
	routePopScore
} from './routePopularity';

describe('routePopScore', () => {
	it('prefers relativePopularity', () => {
		expect(routePopScore({ relativePopularity: 12, popularity: 80 })).toBe(12);
	});
});

describe('buildRoutePopularityStats', () => {
	it('returns null without data', () => {
		expect(buildRoutePopularityStats([{ routeId: 1, routeName: 'X' }])).toBeNull();
	});

	it('splits busy vs quiet', () => {
		const stats = buildRoutePopularityStats([
			{ routeId: 1, routeName: 'A', relativePopularity: POPULARITY_BUSY_THRESHOLD },
			{ routeId: 2, routeName: 'B', relativePopularity: 10 }
		]);
		expect(stats?.busy.count).toBe(1);
		expect(stats?.quiet.count).toBe(1);
	});
});

describe('gemQualityScore', () => {
	it('maps stars', () => {
		expect(gemQualityScore({ routeId: 1, routeName: 'x', stars: 3 })).toBe(75);
	});
});

it('keeps distinct route identities for gems sharing a name and grade (#131)', () => {
	const gems = buildRoutePopularityStats(
		[1, 2].map((routeId) => ({
			routeId,
			routeName: 'Unnamed',
			gradeLabel: '20',
			cragName: 'Crag ' + routeId,
			isSend: true,
			stars: 3,
			popularity: 10,
			ascentCount: 3
		}))
	)!.hiddenGems;
	expect(gems.map((g) => g.routeId)).toEqual([1, 2]);
	expect(new Set(gems.map((g) => g.routeId)).size).toBe(2);
});
