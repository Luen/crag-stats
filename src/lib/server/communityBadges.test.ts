import { describe, expect, it } from 'vitest';
import { communityAscentBadgeHits } from './communityBadges';
import { buildBadges } from './badges';

describe('communityAscentBadgeHits (#146)', () => {
	it('returns nothing without paired coverage', () => {
		expect(
			communityAscentBadgeHits({
				communityAscents: 100,
				sportOrBoltedAscents: 100,
				routesPutUp: 2,
				routesWithCommunityData: 0
			})
		).toEqual([]);
	});

	it('awards total and sport thresholds from the estimate', () => {
		const hits = communityAscentBadgeHits({
			communityAscents: 120,
			sportOrBoltedAscents: 55,
			routesPutUp: 4,
			routesWithCommunityData: 3
		});
		expect(hits.map((h) => h.id)).toEqual([
			'community_10',
			'community_50',
			'community_100',
			'community_sport_10',
			'community_sport_50'
		]);
		expect(hits.find((h) => h.id === 'community_100')?.detail).toContain('covers 3 of 4');
		expect(hits.every((h) => h.detail.includes('estimate'))).toBe(true);
	});

	it('does not invent dates when badges are applied', () => {
		const hits = communityAscentBadgeHits({
			communityAscents: 50,
			sportOrBoltedAscents: 10,
			routesPutUp: 1,
			routesWithCommunityData: 1
		});
		const earned = buildBadges([], [], hits).earned;
		const community = earned.filter((b) => b.id.startsWith('community_'));
		expect(community.length).toBe(3);
		expect(community.every((b) => b.date === null)).toBe(true);
	});

	it('dedupes when the same hits are passed twice via mark()', () => {
		const hits = communityAscentBadgeHits({
			communityAscents: 10,
			sportOrBoltedAscents: 0,
			routesPutUp: 1,
			routesWithCommunityData: 1
		});
		const once = buildBadges([], [], hits).earned.filter((b) => b.id === 'community_10');
		const twice = buildBadges([], [], [...hits, ...hits]).earned.filter(
			(b) => b.id === 'community_10'
		);
		expect(once).toHaveLength(1);
		expect(twice).toHaveLength(1);
		expect(twice[0]?.detail).toBe(once[0]?.detail);
	});
});
