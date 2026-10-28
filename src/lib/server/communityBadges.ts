/**
 * Community-ascent milestone hits for routes the owner put up (#146).
 * Pure — uses the paired snapshot estimate from routeDeveloperImpact (#140).
 * No earned date: aggregate counters are stale snapshots, not event timestamps.
 */
import type { RouteDeveloperImpact } from './routeDeveloperImpact';
import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';

export type CommunityBadgeHit = {
	id: string;
	detail: string;
};

/** Total community ascents (non-owner ticks) on FA/setter routes. */
export const COMMUNITY_TOTAL_THRESHOLDS = [
	{ id: 'community_10', n: 10, label: '10 community ascents' },
	{ id: 'community_50', n: 50, label: '50 community ascents' },
	{ id: 'community_100', n: 100, label: '100 community ascents' },
	{ id: 'community_500', n: 500, label: '500 community ascents' }
] as const;

/** Sport gear style or bolted subset. */
export const COMMUNITY_SPORT_THRESHOLDS = [
	{ id: 'community_sport_10', n: 10, label: '10 sport/bolted community ascents' },
	{ id: 'community_sport_50', n: 50, label: '50 sport/bolted community ascents' },
	{ id: 'community_sport_100', n: 100, label: '100 sport/bolted community ascents' }
] as const;

function coverageNote(
	impact: Pick<RouteDeveloperImpact, 'routesPutUp' | 'routesWithCommunityData'>,
	display: DateDisplay
): string {
	if (impact.routesPutUp <= 0) return '';
	if (impact.routesWithCommunityData >= impact.routesPutUp) {
		return ` · covers ${formatNumber(impact.routesWithCommunityData, display)} routes`;
	}
	return ` · covers ${formatNumber(impact.routesWithCommunityData, display)} of ${formatNumber(impact.routesPutUp, display)} routes`;
}

/** Threshold hits from a developer-impact aggregate. Counts are ascents, not people. */
export function communityAscentBadgeHits(
	impact: Pick<
		RouteDeveloperImpact,
		'communityAscents' | 'sportOrBoltedAscents' | 'routesPutUp' | 'routesWithCommunityData'
	>,
	display: DateDisplay = DEFAULT_DATE_DISPLAY
): CommunityBadgeHit[] {
	if (impact.routesWithCommunityData <= 0) return [];

	const note = coverageNote(impact, display);
	const hits: CommunityBadgeHit[] = [];
	for (const t of COMMUNITY_TOTAL_THRESHOLDS) {
		if (impact.communityAscents < t.n) continue;
		hits.push({
			id: t.id,
			detail: `~${formatNumber(impact.communityAscents, display)} community ascents (estimate)${note}`
		});
	}
	for (const t of COMMUNITY_SPORT_THRESHOLDS) {
		if (impact.sportOrBoltedAscents < t.n) continue;
		hits.push({
			id: t.id,
			detail: `~${formatNumber(impact.sportOrBoltedAscents, display)} on sport/bolted (estimate)${note}`
		});
	}
	return hits;
}
