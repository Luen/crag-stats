/**
 * Community-ascent milestone hits for routes the owner put up (#146).
 * Pure — uses the paired snapshot estimate from routeDeveloperImpact (#140).
 * No earned date: aggregate counters are stale snapshots, not event timestamps.
 */
import type { RouteDeveloperImpact } from './routeDeveloperImpact';
import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';

export type CommunityBadgeHit = {
	id: string;
	detail: string;
};

/** Total community ascents (non-owner ticks) on FA/setter routes. */
export const COMMUNITY_TOTAL_THRESHOLDS = [
	{ id: 'community_10', n: 10 },
	{ id: 'community_50', n: 50 },
	{ id: 'community_100', n: 100 },
	{ id: 'community_500', n: 500 }
] as const;

/** Sport gear style or bolted subset. */
export const COMMUNITY_SPORT_THRESHOLDS = [
	{ id: 'community_sport_10', n: 10 },
	{ id: 'community_sport_50', n: 50 },
	{ id: 'community_sport_100', n: 100 }
] as const;

function coverageNote(
	impact: Pick<RouteDeveloperImpact, 'routesPutUp' | 'routesWithCommunityData'>,
	display: DateDisplay,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	if (impact.routesPutUp <= 0) return '';
	if (impact.routesWithCommunityData >= impact.routesPutUp) {
		return ` · ${formatMessage(locale, 'cards.badges.detailCoversRoutes', {
			count: formatNumber(impact.routesWithCommunityData, display)
		})}`;
	}
	return ` · ${formatMessage(locale, 'cards.badges.detailCoversRoutesOfTotal', {
		covered: formatNumber(impact.routesWithCommunityData, display),
		total: formatNumber(impact.routesPutUp, display)
	})}`;
}

/** Threshold hits from a developer-impact aggregate. Counts are ascents, not people. */
export function communityAscentBadgeHits(
	impact: Pick<
		RouteDeveloperImpact,
		'communityAscents' | 'sportOrBoltedAscents' | 'routesPutUp' | 'routesWithCommunityData'
	>,
	display: DateDisplay = DEFAULT_DATE_DISPLAY,
	locale: SupportedLocale = DEFAULT_LOCALE
): CommunityBadgeHit[] {
	if (impact.routesWithCommunityData <= 0) return [];

	const note = coverageNote(impact, display, locale);
	const hits: CommunityBadgeHit[] = [];
	for (const t of COMMUNITY_TOTAL_THRESHOLDS) {
		if (impact.communityAscents < t.n) continue;
		hits.push({
			id: t.id,
			detail: `${formatMessage(locale, 'cards.badges.detailCommunityAscents', {
				count: formatNumber(impact.communityAscents, display)
			})}${note}`
		});
	}
	for (const t of COMMUNITY_SPORT_THRESHOLDS) {
		if (impact.sportOrBoltedAscents < t.n) continue;
		hits.push({
			id: t.id,
			detail: `${formatMessage(locale, 'cards.badges.detailCommunitySportAscents', {
				count: formatNumber(impact.sportOrBoltedAscents, display)
			})}${note}`
		});
	}
	return hits;
}
