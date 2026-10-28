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
