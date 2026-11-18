import { consecutiveDayRuns, STREAK_DAY_THRESHOLDS } from '#lib/dayStreaks';
/**
 * RoxClimbs-inspired badges: real milestones from logged data.
 * Taking a break does not erase a milestone — recognition when something genuinely happened.
 */

import { climbStyleLabel } from '#lib/climbStyle';
import { ascentPartners } from '#lib/partnerStats';
import { soloKind } from './solo';
import { isSunFacingSummer } from '#lib/sunFacing';

import { calendarDay as dayKey } from '#lib/calendarDay';
import {
	DEFAULT_DISPLAY_SYSTEMS,
	formatGradeLabel,
	usesVScale,
	type DisplayGradeSystems
} from '#lib/grades';
import { DEFAULT_LOCALE, formatMessage, type SupportedLocale } from '#lib/i18n';
import { tickKind } from '#lib/ticks';
import {
	DEFAULT_DATE_DISPLAY,
	formatCalendarDate,
	formatDateTime,
	formatNumber,
	type DateDisplay
} from '#lib/dates';
import {
	DEFAULT_DISPLAY_UNITS,
	formatDistance,
	formatHeight,
	formatPrecipitation,
	formatTemperature,
	formatWind,
	type DisplayUnits
} from '#lib/units';
import {
	isFairWeather,
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	isStickyHumidity,
	isStormPrecip,
	isWindyWeather,
	lookupAscentWeather,
	type WeatherSnapshot
} from '#lib/weatherKeys';
import type { FirstImport } from './firstImport';
import { rankAlmostBadges, type BadgeAlmost } from '#lib/badgeProgress';
import type { CommunityBadgeHit } from './communityBadges';
import { displayStyle, splitPartners, type DashboardExtraRow } from './dashboardExtras';
import { isLikelyIndoorRoute } from './venue';
import { classifyTick } from './providers/types';

export type BadgeIcon =
	| 'carabiner'
	| 'knot'
	| 'sun'
	| 'bolt'
	| 'eye'
	| 'flag'
	| 'mountain'
	| 'star'
	| 'calendar'
	| 'globe'
	| 'route'
	| 'send'
	| 'hanger'
	| 'thermometer'
	| 'droplet'
	| 'snowflake'
	| 'wind';

export type BadgeTone = 'warm' | 'green' | 'blue' | 'purple' | 'slate';

export type BadgeDef = {
	id: string;
	title: string;
	hint: string;
	/** Hint wording for the owner's unit settings; thresholds stay metric (#484). */
	hintForUnits?: (units: DisplayUnits, locale?: SupportedLocale) => string;
	icon: BadgeIcon;
	tone: BadgeTone;
};

export type BadgeCard = {
	id: string;
	title: string;
	hint: string;
	icon: BadgeIcon;
	tone: BadgeTone;
	earned: boolean;
	detail: string | null;
	date: string | null;
	routeName: string | null;
	href: string | null;
};

export type SetterBadgeHit = {
	date: string | null;
	routeName: string | null;
	href: string | null;
	detail: string;
};

export type BadgesResult = {
	earned: BadgeCard[];
	locked: BadgeCard[];
	earnedCount: number;
	totalCount: number;
	/** Top locked countable badges by % complete (#254). */
	almost: BadgeAlmost[];
};

type Hit = {
	date: string | null;
	routeName: string | null;
	href: string | null;
	detail: string;
};

function scoreOf(row: DashboardExtraRow): number | null {
	const s = row.effectiveGradeScore ?? row.gradeScore;
	return s != null && Number.isFinite(s) ? Number(s) : null;
}

function heightOf(row: DashboardExtraRow): number {
	const h = row.heightM ?? row.routeHeightM;
	return h != null && Number.isFinite(h) && h > 0 ? Number(h) : 0;
}

/** V-scale score (boulders, V-graded DWS/highballs), from the grade system first (#72). */
function isVScaleRow(row: DashboardExtraRow): boolean {
	return usesVScale(row.gradeSystem, row.gearStyle);
}

function isWeekend(iso: string): boolean {
	const d = new Date(`${iso}T12:00:00Z`);
	if (Number.isNaN(d.getTime())) return false;
	const day = d.getUTCDay();
	return day === 0 || day === 6;
}

/** Short calendar date for badge cards, e.g. "27 Aug 2018" or the owner's configured format. */
export function formatBadgeDate(
	iso: string | null | undefined,
	display: DateDisplay = DEFAULT_DATE_DISPLAY
): string {
	const key = dayKey(iso);
	if (!key) return '';
	return formatCalendarDate(key, display);
}

function routeLine(
	name: string | null | undefined,
	date: string | null,
	display: DateDisplay
): string {
	const n = (name || '').trim();
	const when = formatBadgeDate(date, display);
	if (n && when) return `${n}, ${when}`;
	if (n) return n;
	if (when) return when;
	return '';
}

/** Explicit provider tick or a clean lead of a sport route using trad protection. */
export function isGreenpoint(row: DashboardExtraRow): boolean {
	if (!row.isSend) return false;
	const tick = (row.tickType ?? '').toLowerCase().replace(/[\s_-]+/g, '');
	if (['greenpoint', 'greenpointonsight', 'greenpointflash'].includes(tick)) return true;
	return (
		row.gearStyle?.trim().toLowerCase() === 'sport' &&
		row.ascentGearStyle?.trim().toLowerCase() === 'trad' &&
		['onsight', 'flash', 'redpoint', 'pinkpoint', 'groundupredpoint', 'lead'].includes(tick)
	);
}

/** Cumulative height thresholds in metres (#484): one catalogue, metric thresholds. */
const HEIGHT_BADGES = [
	{ id: 'height_1km', m: 1000, tone: 'warm' as const },
	{ id: 'height_5km', m: 5000, tone: 'green' as const },
	{ id: 'height_10km', m: 10000, tone: 'blue' as const },
	{ id: 'height_20km', m: 20000, tone: 'purple' as const },
	{ id: 'height_50km', m: 50000, tone: 'warm' as const },
	{ id: 'height_100km', m: 100000, tone: 'green' as const },
	{ id: 'height_150km', m: 150000, tone: 'blue' as const }
];

const BADGE_CATALOG_KEYS: Record<string, { titleKey: string; hintKey?: string }> = {
	first_moves: {
		titleKey: 'cards.badges.catalog.first_moves_title',
		hintKey: 'cards.badges.catalog.first_moves_hint'
	},
	first_session: {
		titleKey: 'cards.badges.catalog.first_session_title',
		hintKey: 'cards.badges.catalog.first_session_hint'
	},
	first_send: {
		titleKey: 'cards.badges.catalog.first_send_title',
		hintKey: 'cards.badges.catalog.first_send_hint'
	},
	first_onsight: {
		titleKey: 'cards.badges.catalog.first_onsight_title',
		hintKey: 'cards.badges.catalog.first_onsight_hint'
	},
	first_flash: {
		titleKey: 'cards.badges.catalog.first_flash_title',
		hintKey: 'cards.badges.catalog.first_flash_hint'
	},
	ascents_10: {
		titleKey: 'cards.badges.catalog.ascents_10_title',
		hintKey: 'cards.badges.catalog.ascents_10_hint'
	},
	ascents_25: {
		titleKey: 'cards.badges.catalog.ascents_25_title',
		hintKey: 'cards.badges.catalog.ascents_25_hint'
	},
	ascents_50: {
		titleKey: 'cards.badges.catalog.ascents_50_title',
		hintKey: 'cards.badges.catalog.ascents_50_hint'
	},
	ascents_100: {
		titleKey: 'cards.badges.catalog.ascents_100_title',
		hintKey: 'cards.badges.catalog.ascents_100_hint'
	},
	ascents_250: {
		titleKey: 'cards.badges.catalog.ascents_250_title',
		hintKey: 'cards.badges.catalog.ascents_250_hint'
	},
	ascents_500: {
		titleKey: 'cards.badges.catalog.ascents_500_title',
		hintKey: 'cards.badges.catalog.ascents_500_hint'
	},
	ascents_1000: {
		titleKey: 'cards.badges.catalog.ascents_1000_title',
		hintKey: 'cards.badges.catalog.ascents_1000_hint'
	},
	sends_10: {
		titleKey: 'cards.badges.catalog.sends_10_title',
		hintKey: 'cards.badges.catalog.sends_10_hint'
	},
	sends_25: {
		titleKey: 'cards.badges.catalog.sends_25_title',
		hintKey: 'cards.badges.catalog.sends_25_hint'
	},
	sends_50: {
		titleKey: 'cards.badges.catalog.sends_50_title',
		hintKey: 'cards.badges.catalog.sends_50_hint'
	},
	sends_100: {
		titleKey: 'cards.badges.catalog.sends_100_title',
		hintKey: 'cards.badges.catalog.sends_100_hint'
	},
	onsight_10: {
		titleKey: 'cards.badges.catalog.onsight_10_title',
		hintKey: 'cards.badges.catalog.onsight_10_hint'
	},
	onsight_25: {
		titleKey: 'cards.badges.catalog.onsight_25_title',
		hintKey: 'cards.badges.catalog.onsight_25_hint'
	},
	flash_10: {
		titleKey: 'cards.badges.catalog.flash_10_title',
		hintKey: 'cards.badges.catalog.flash_10_hint'
	},
	flash_25: {
		titleKey: 'cards.badges.catalog.flash_25_title',
		hintKey: 'cards.badges.catalog.flash_25_hint'
	},
	weekend_5: {
		titleKey: 'cards.badges.catalog.weekend_5_title',
		hintKey: 'cards.badges.catalog.weekend_5_hint'
	},
	weekend_15: {
		titleKey: 'cards.badges.catalog.weekend_15_title',
		hintKey: 'cards.badges.catalog.weekend_15_hint'
	},
	holiday_christmas: {
		titleKey: 'cards.badges.catalog.holiday_christmas_title',
		hintKey: 'cards.badges.catalog.holiday_christmas_hint'
	},
	holiday_new_year: {
		titleKey: 'cards.badges.catalog.holiday_new_year_title',
		hintKey: 'cards.badges.catalog.holiday_new_year_hint'
	},
	sun_facing_summer: {
		titleKey: 'cards.badges.catalog.sun_facing_summer_title',
		hintKey: 'cards.badges.catalog.sun_facing_summer_hint'
	},
	weather_heat: { titleKey: 'cards.badges.catalog.weather_heat_title' },
	weather_freeze: { titleKey: 'cards.badges.catalog.weather_freeze_title' },
	weather_rain: { titleKey: 'cards.badges.catalog.weather_rain_title' },
	weather_snow: {
		titleKey: 'cards.badges.catalog.weather_snow_title',
		hintKey: 'cards.badges.catalog.weather_snow_hint'
	},
	weather_wind: { titleKey: 'cards.badges.catalog.weather_wind_title' },
	weather_bluebird: { titleKey: 'cards.badges.catalog.weather_bluebird_title' },
	weather_sticky: {
		titleKey: 'cards.badges.catalog.weather_sticky_title',
		hintKey: 'cards.badges.catalog.weather_sticky_hint'
	},
	weather_storm_send: { titleKey: 'cards.badges.catalog.weather_storm_send_title' },
	weather_four_seasons: {
		titleKey: 'cards.badges.catalog.weather_four_seasons_title',
		hintKey: 'cards.badges.catalog.weather_four_seasons_hint'
	},
	partners_crowded_belay: {
		titleKey: 'cards.badges.catalog.partners_crowded_belay_title',
		hintKey: 'cards.badges.catalog.partners_crowded_belay_hint'
	},
	multipitch_day: {
		titleKey: 'cards.badges.catalog.multipitch_day_title',
		hintKey: 'cards.badges.catalog.multipitch_day_hint'
	},
	travel_week: {
		titleKey: 'cards.badges.catalog.travel_week_title',
		hintKey: 'cards.badges.catalog.travel_week_hint'
	},
	route_persistence: {
		titleKey: 'cards.badges.catalog.route_persistence_title',
		hintKey: 'cards.badges.catalog.route_persistence_hint'
	},
	greenpoint: {
		titleKey: 'cards.badges.catalog.greenpoint_title',
		hintKey: 'cards.badges.catalog.greenpoint_hint'
	},
	first_lead_rope_solo: {
		titleKey: 'cards.badges.catalog.first_lead_rope_solo_title',
		hintKey: 'cards.badges.catalog.first_lead_rope_solo_hint'
	},
	first_top_rope_solo: {
		titleKey: 'cards.badges.catalog.first_top_rope_solo_title',
		hintKey: 'cards.badges.catalog.first_top_rope_solo_hint'
	},
	sessions_10: {
		titleKey: 'cards.badges.catalog.sessions_10_title',
		hintKey: 'cards.badges.catalog.sessions_10_hint'
	},
	sessions_50: {
		titleKey: 'cards.badges.catalog.sessions_50_title',
		hintKey: 'cards.badges.catalog.sessions_50_hint'
	},
	sessions_100: {
		titleKey: 'cards.badges.catalog.sessions_100_title',
		hintKey: 'cards.badges.catalog.sessions_100_hint'
	},
	height_1km: { titleKey: 'cards.badges.catalog.height_1km_title' },
	height_5km: { titleKey: 'cards.badges.catalog.height_5km_title' },
	height_10km: { titleKey: 'cards.badges.catalog.height_10km_title' },
	height_20km: { titleKey: 'cards.badges.catalog.height_20km_title' },
	height_50km: { titleKey: 'cards.badges.catalog.height_50km_title' },
	height_100km: { titleKey: 'cards.badges.catalog.height_100km_title' },
	height_150km: { titleKey: 'cards.badges.catalog.height_150km_title' },
	day_height_250: { titleKey: 'cards.badges.catalog.day_height_250_title' },
	country_1: {
		titleKey: 'cards.badges.catalog.country_1_title',
		hintKey: 'cards.badges.catalog.country_1_hint'
	},
	country_2: {
		titleKey: 'cards.badges.catalog.country_2_title',
		hintKey: 'cards.badges.catalog.country_2_hint'
	},
	country_5: {
		titleKey: 'cards.badges.catalog.country_5_title',
		hintKey: 'cards.badges.catalog.country_5_hint'
	},
	country_10: {
		titleKey: 'cards.badges.catalog.country_10_title',
		hintKey: 'cards.badges.catalog.country_10_hint'
	},
	distinct_routes_50: {
		titleKey: 'cards.badges.catalog.distinct_routes_50_title',
		hintKey: 'cards.badges.catalog.distinct_routes_50_hint'
	},
	distinct_routes_100: {
		titleKey: 'cards.badges.catalog.distinct_routes_100_title',
		hintKey: 'cards.badges.catalog.distinct_routes_100_hint'
	},
	distinct_routes_250: {
		titleKey: 'cards.badges.catalog.distinct_routes_250_title',
		hintKey: 'cards.badges.catalog.distinct_routes_250_hint'
	},
	distinct_routes_500: {
		titleKey: 'cards.badges.catalog.distinct_routes_500_title',
		hintKey: 'cards.badges.catalog.distinct_routes_500_hint'
	},
	route_days_10: {
		titleKey: 'cards.badges.catalog.route_days_10_title',
		hintKey: 'cards.badges.catalog.route_days_10_hint'
	},
	home_turf_25: {
		titleKey: 'cards.badges.catalog.home_turf_25_title',
		hintKey: 'cards.badges.catalog.home_turf_25_hint'
	},
	style_sport: {
		titleKey: 'cards.badges.catalog.style_sport_title',
		hintKey: 'cards.badges.catalog.style_sport_hint'
	},
	style_trad: {
		titleKey: 'cards.badges.catalog.style_trad_title',
		hintKey: 'cards.badges.catalog.style_trad_hint'
	},
	style_boulder: {
		titleKey: 'cards.badges.catalog.style_boulder_title',
		hintKey: 'cards.badges.catalog.style_boulder_hint'
	},
	band_intermediate: {
		titleKey: 'grades.bands.intermediate',
		hintKey: 'cards.badges.catalog.band_intermediate_hint'
	},
	band_experienced: {
		titleKey: 'grades.bands.experienced',
		hintKey: 'cards.badges.catalog.band_experienced_hint'
	},
	band_expert: {
		titleKey: 'grades.bands.expert',
		hintKey: 'cards.badges.catalog.band_expert_hint'
	},
	band_elite: {
		titleKey: 'grades.bands.elite',
		hintKey: 'cards.badges.catalog.band_elite_hint'
	},
	new_high: {
		titleKey: 'cards.badges.catalog.new_high_title',
		hintKey: 'cards.badges.catalog.new_high_hint'
	},
	first_fa: {
		titleKey: 'cards.badges.catalog.first_fa_title',
		hintKey: 'cards.badges.catalog.first_fa_hint'
	},
	first_ffa: {
		titleKey: 'cards.badges.catalog.first_ffa_title',
		hintKey: 'cards.badges.catalog.first_ffa_hint'
	},
	fa_5: {
		titleKey: 'cards.badges.catalog.fa_5_title',
		hintKey: 'cards.badges.catalog.fa_5_hint'
	},
	fa_10: {
		titleKey: 'cards.badges.catalog.fa_10_title',
		hintKey: 'cards.badges.catalog.fa_10_hint'
	},
	fa_20: {
		titleKey: 'cards.badges.catalog.fa_20_title',
		hintKey: 'cards.badges.catalog.fa_20_hint'
	},
	fa_50: {
		titleKey: 'cards.badges.catalog.fa_50_title',
		hintKey: 'cards.badges.catalog.fa_50_hint'
	},
	fa_100: {
		titleKey: 'cards.badges.catalog.fa_100_title',
		hintKey: 'cards.badges.catalog.fa_100_hint'
	},
	ffa_5: {
		titleKey: 'cards.badges.catalog.ffa_5_title',
		hintKey: 'cards.badges.catalog.ffa_5_hint'
	},
	ffa_10: {
		titleKey: 'cards.badges.catalog.ffa_10_title',
		hintKey: 'cards.badges.catalog.ffa_10_hint'
	},
	ffa_20: {
		titleKey: 'cards.badges.catalog.ffa_20_title',
		hintKey: 'cards.badges.catalog.ffa_20_hint'
	},
	ffa_50: {
		titleKey: 'cards.badges.catalog.ffa_50_title',
		hintKey: 'cards.badges.catalog.ffa_50_hint'
	},
	ffa_100: {
		titleKey: 'cards.badges.catalog.ffa_100_title',
		hintKey: 'cards.badges.catalog.ffa_100_hint'
	},
	fa_sport_10: {
		titleKey: 'cards.badges.catalog.fa_sport_10_title',
		hintKey: 'cards.badges.catalog.fa_sport_10_hint'
	},
	fa_sport_20: {
		titleKey: 'cards.badges.catalog.fa_sport_20_title',
		hintKey: 'cards.badges.catalog.fa_sport_20_hint'
	},
	fa_sport_50: {
		titleKey: 'cards.badges.catalog.fa_sport_50_title',
		hintKey: 'cards.badges.catalog.fa_sport_50_hint'
	},
	fa_trad_10: {
		titleKey: 'cards.badges.catalog.fa_trad_10_title',
		hintKey: 'cards.badges.catalog.fa_trad_10_hint'
	},
	fa_trad_20: {
		titleKey: 'cards.badges.catalog.fa_trad_20_title',
		hintKey: 'cards.badges.catalog.fa_trad_20_hint'
	},
	fa_trad_50: {
		titleKey: 'cards.badges.catalog.fa_trad_50_title',
		hintKey: 'cards.badges.catalog.fa_trad_50_hint'
	},
	fa_boulder_10: {
		titleKey: 'cards.badges.catalog.fa_boulder_10_title',
		hintKey: 'cards.badges.catalog.fa_boulder_10_hint'
	},
	fa_boulder_20: {
		titleKey: 'cards.badges.catalog.fa_boulder_20_title',
		hintKey: 'cards.badges.catalog.fa_boulder_20_hint'
	},
	fa_boulder_50: {
		titleKey: 'cards.badges.catalog.fa_boulder_50_title',
		hintKey: 'cards.badges.catalog.fa_boulder_50_hint'
	},
	first_setter: {
		titleKey: 'cards.badges.catalog.first_setter_title',
		hintKey: 'cards.badges.catalog.first_setter_hint'
	},
	setter_5: {
		titleKey: 'cards.badges.catalog.setter_5_title',
		hintKey: 'cards.badges.catalog.setter_5_hint'
	},
	setter_10: {
		titleKey: 'cards.badges.catalog.setter_10_title',
		hintKey: 'cards.badges.catalog.setter_10_hint'
	},
	setter_25: {
		titleKey: 'cards.badges.catalog.setter_25_title',
		hintKey: 'cards.badges.catalog.setter_25_hint'
	},
	community_10: {
		titleKey: 'cards.badges.catalog.community_10_title',
		hintKey: 'cards.badges.catalog.community_10_hint'
	},
	community_50: {
		titleKey: 'cards.badges.catalog.community_50_title',
		hintKey: 'cards.badges.catalog.community_50_hint'
	},
	community_100: {
		titleKey: 'cards.badges.catalog.community_100_title',
		hintKey: 'cards.badges.catalog.community_100_hint'
	},
	community_500: {
		titleKey: 'cards.badges.catalog.community_500_title',
		hintKey: 'cards.badges.catalog.community_500_hint'
	},
	community_sport_10: {
		titleKey: 'cards.badges.catalog.community_sport_10_title',
		hintKey: 'cards.badges.catalog.community_sport_10_hint'
	},
	community_sport_50: {
		titleKey: 'cards.badges.catalog.community_sport_50_title',
		hintKey: 'cards.badges.catalog.community_sport_50_hint'
	},
	community_sport_100: {
		titleKey: 'cards.badges.catalog.community_sport_100_title',
		hintKey: 'cards.badges.catalog.community_sport_100_hint'
	}
};

type BadgeSpec = Omit<BadgeDef, 'title' | 'hint'>;

function badgeTitle(def: BadgeSpec, locale: SupportedLocale): string {
	if (def.id.startsWith('streak_days_')) {
		const count = Number(def.id.slice('streak_days_'.length));
		return formatMessage(locale, 'cards.badges.catalog.streak_days_title', { count });
	}
	const keys = BADGE_CATALOG_KEYS[def.id];
	return keys ? formatMessage(locale, keys.titleKey) : def.id;
}

function badgeHint(def: BadgeSpec, units: DisplayUnits, locale: SupportedLocale): string {
	if (def.hintForUnits) return def.hintForUnits(units, locale);
	if (def.id.startsWith('streak_days_')) {
		const count = Number(def.id.slice('streak_days_'.length));
		return formatMessage(locale, 'cards.badges.catalog.streak_days_hint', { count });
	}
	const keys = BADGE_CATALOG_KEYS[def.id];
	return keys?.hintKey ? formatMessage(locale, keys.hintKey) : '';
}

const BADGE_SPECS: readonly BadgeSpec[] = [
	{ id: 'first_moves', icon: 'carabiner', tone: 'warm' },
	{ id: 'first_session', icon: 'knot', tone: 'warm' },
	{ id: 'first_send', icon: 'send', tone: 'green' },
	{ id: 'first_onsight', icon: 'eye', tone: 'blue' },
	{ id: 'first_flash', icon: 'bolt', tone: 'green' },
	{ id: 'ascents_10', icon: 'route', tone: 'warm' },
	{ id: 'ascents_25', icon: 'route', tone: 'warm' },
	{ id: 'ascents_50', icon: 'route', tone: 'warm' },
	{ id: 'ascents_100', icon: 'star', tone: 'green' },
	{ id: 'ascents_250', icon: 'star', tone: 'green' },
	{ id: 'ascents_500', icon: 'star', tone: 'blue' },
	{ id: 'ascents_1000', icon: 'mountain', tone: 'purple' },
	{ id: 'sends_10', icon: 'send', tone: 'green' },
	{ id: 'sends_25', icon: 'send', tone: 'green' },
	{ id: 'sends_50', icon: 'send', tone: 'blue' },
	{ id: 'sends_100', icon: 'send', tone: 'purple' },
	{ id: 'onsight_10', icon: 'eye', tone: 'blue' },
	{ id: 'onsight_25', icon: 'eye', tone: 'purple' },
	{ id: 'flash_10', icon: 'bolt', tone: 'green' },
	{ id: 'flash_25', icon: 'bolt', tone: 'green' },
	{ id: 'weekend_5', icon: 'sun', tone: 'warm' },
	{ id: 'weekend_15', icon: 'sun', tone: 'green' },
	...STREAK_DAY_THRESHOLDS.map((n): BadgeSpec => ({
		id: `streak_days_${n}`,
		icon: 'calendar',
		tone: n === 30 ? 'purple' : n === 10 ? 'blue' : 'green'
	})),
	{ id: 'holiday_christmas', icon: 'calendar', tone: 'warm' },
	{ id: 'holiday_new_year', icon: 'calendar', tone: 'warm' },
	{ id: 'sun_facing_summer', icon: 'sun', tone: 'warm' },
	{
		id: 'weather_heat',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_heat_hint', {
				temp: formatTemperature(35, units.temperature)
			}),
		icon: 'thermometer',
		tone: 'warm'
	},
	{
		id: 'weather_freeze',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_freeze_hint', {
				temp: formatTemperature(0, units.temperature)
			}),
		icon: 'snowflake',
		tone: 'blue'
	},
	{
		id: 'weather_rain',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_rain_hint', {
				precip: formatPrecipitation(1, units.precipitation)
			}),
		icon: 'droplet',
		tone: 'blue'
	},
	{ id: 'weather_snow', icon: 'snowflake', tone: 'purple' },
	{
		id: 'weather_wind',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_wind_hint', {
				wind: formatWind(50, units.wind)
			}),
		icon: 'wind',
		tone: 'slate'
	},
	{
		id: 'weather_bluebird',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_bluebird_hint', {
				low: formatTemperature(15, units.temperature),
				high: formatTemperature(25, units.temperature)
			}),
		icon: 'sun',
		tone: 'blue'
	},
	{ id: 'weather_sticky', icon: 'droplet', tone: 'green' },
	{
		id: 'weather_storm_send',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.weather_storm_send_hint', {
				precip: formatPrecipitation(10, units.precipitation)
			}),
		icon: 'bolt',
		tone: 'purple'
	},
	{ id: 'weather_four_seasons', icon: 'globe', tone: 'warm' },
	{ id: 'partners_crowded_belay', icon: 'carabiner', tone: 'green' },
	{ id: 'multipitch_day', icon: 'route', tone: 'blue' },
	{ id: 'travel_week', icon: 'globe', tone: 'warm' },
	{ id: 'route_persistence', icon: 'knot', tone: 'purple' },
	{ id: 'greenpoint', icon: 'knot', tone: 'green' },
	{ id: 'first_lead_rope_solo', icon: 'carabiner', tone: 'blue' },
	{ id: 'first_top_rope_solo', icon: 'knot', tone: 'purple' },
	{ id: 'sessions_10', icon: 'calendar', tone: 'warm' },
	{ id: 'sessions_50', icon: 'calendar', tone: 'green' },
	{ id: 'sessions_100', icon: 'calendar', tone: 'blue' },
	...HEIGHT_BADGES.map((b): BadgeSpec => ({
		id: b.id,
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.height_climb_hint', {
				distance: formatDistance(b.m / 1000, units.distance)
			}),
		icon: 'mountain',
		tone: b.tone
	})),
	{
		id: 'day_height_250',
		hintForUnits: (units, locale = DEFAULT_LOCALE) =>
			formatMessage(locale, 'cards.badges.catalog.day_height_250_hint', {
				height: formatHeight(250, units.height)
			}),
		icon: 'mountain',
		tone: 'green'
	},
	{ id: 'country_1', icon: 'flag', tone: 'warm' },
	{ id: 'country_2', icon: 'globe', tone: 'green' },
	{ id: 'country_5', icon: 'globe', tone: 'blue' },
	{ id: 'country_10', icon: 'globe', tone: 'purple' },
	{ id: 'distinct_routes_50', icon: 'route', tone: 'warm' },
	{ id: 'distinct_routes_100', icon: 'route', tone: 'green' },
	{ id: 'distinct_routes_250', icon: 'route', tone: 'blue' },
	{ id: 'distinct_routes_500', icon: 'route', tone: 'purple' },
	{ id: 'route_days_10', icon: 'knot', tone: 'green' },
	{ id: 'home_turf_25', icon: 'flag', tone: 'blue' },
	{ id: 'style_sport', icon: 'carabiner', tone: 'blue' },
	{ id: 'style_trad', icon: 'knot', tone: 'warm' },
	{ id: 'style_boulder', icon: 'route', tone: 'green' },
	{ id: 'band_intermediate', icon: 'star', tone: 'warm' },
	{ id: 'band_experienced', icon: 'star', tone: 'green' },
	{ id: 'band_expert', icon: 'star', tone: 'blue' },
	{ id: 'band_elite', icon: 'star', tone: 'purple' },
	{ id: 'new_high', icon: 'flag', tone: 'green' },
	{ id: 'first_fa', icon: 'hanger', tone: 'purple' },
	{ id: 'first_ffa', icon: 'hanger', tone: 'blue' },
	{ id: 'fa_5', icon: 'hanger', tone: 'warm' },
	{ id: 'fa_10', icon: 'hanger', tone: 'purple' },
	{ id: 'fa_20', icon: 'hanger', tone: 'green' },
	{ id: 'fa_50', icon: 'hanger', tone: 'blue' },
	{ id: 'fa_100', icon: 'hanger', tone: 'purple' },
	{ id: 'ffa_5', icon: 'hanger', tone: 'warm' },
	{ id: 'ffa_10', icon: 'hanger', tone: 'blue' },
	{ id: 'ffa_20', icon: 'hanger', tone: 'green' },
	{ id: 'ffa_50', icon: 'hanger', tone: 'purple' },
	{ id: 'ffa_100', icon: 'hanger', tone: 'purple' },
	{ id: 'fa_sport_10', icon: 'hanger', tone: 'blue' },
	{ id: 'fa_sport_20', icon: 'hanger', tone: 'blue' },
	{ id: 'fa_sport_50', icon: 'hanger', tone: 'blue' },
	{ id: 'fa_trad_10', icon: 'hanger', tone: 'warm' },
	{ id: 'fa_trad_20', icon: 'hanger', tone: 'warm' },
	{ id: 'fa_trad_50', icon: 'hanger', tone: 'warm' },
	{ id: 'fa_boulder_10', icon: 'hanger', tone: 'purple' },
	{ id: 'fa_boulder_20', icon: 'hanger', tone: 'purple' },
	{ id: 'fa_boulder_50', icon: 'hanger', tone: 'purple' },
	{ id: 'first_setter', icon: 'bolt', tone: 'warm' },
	{ id: 'setter_5', icon: 'bolt', tone: 'green' },
	{ id: 'setter_10', icon: 'bolt', tone: 'blue' },
	{ id: 'setter_25', icon: 'bolt', tone: 'purple' },
	{ id: 'community_10', icon: 'globe', tone: 'warm' },
	{ id: 'community_50', icon: 'globe', tone: 'green' },
	{ id: 'community_100', icon: 'globe', tone: 'blue' },
	{ id: 'community_500', icon: 'globe', tone: 'purple' },
	{ id: 'community_sport_10', icon: 'carabiner', tone: 'warm' },
	{ id: 'community_sport_50', icon: 'carabiner', tone: 'green' },
	{ id: 'community_sport_100', icon: 'carabiner', tone: 'blue' }
];

/** Static catalog — order is display order for locked badges. */
export const BADGE_CATALOG: readonly BadgeDef[] = BADGE_SPECS.map((spec) => ({
	...spec,
	title: badgeTitle(spec, DEFAULT_LOCALE),
	hint: badgeHint(spec, DEFAULT_DISPLAY_UNITS, DEFAULT_LOCALE)
}));

const COUNT_BADGES: { id: string; n: number }[] = [
	{ id: 'ascents_10', n: 10 },
	{ id: 'ascents_25', n: 25 },
	{ id: 'ascents_50', n: 50 },
	{ id: 'ascents_100', n: 100 },
	{ id: 'ascents_250', n: 250 },
	{ id: 'ascents_500', n: 500 },
	{ id: 'ascents_1000', n: 1000 }
];

const SEND_BADGES = [
	{ id: 'sends_10', n: 10 },
	{ id: 'sends_25', n: 25 },
	{ id: 'sends_50', n: 50 },
	{ id: 'sends_100', n: 100 }
];

const ONSIGHT_BADGES = [
	{ id: 'onsight_10', n: 10 },
	{ id: 'onsight_25', n: 25 }
];

const FLASH_BADGES = [
	{ id: 'flash_10', n: 10 },
	{ id: 'flash_25', n: 25 }
];

const SESSION_BADGES = [
	{ id: 'sessions_10', n: 10 },
	{ id: 'sessions_50', n: 50 },
	{ id: 'sessions_100', n: 100 }
];

/** Distinct routes logged (sends or attempts), keyed by provider route id. */
const DISTINCT_ROUTE_BADGES = [
	{ id: 'distinct_routes_50', n: 50 },
	{ id: 'distinct_routes_100', n: 100 },
	{ id: 'distinct_routes_250', n: 250 },
	{ id: 'distinct_routes_500', n: 500 }
] as const;

/** Days on one route for Old Faithful; repeat ascents at one crag for Home Turf. */
const ROUTE_DAYS_TARGET = 10;
const HOME_TURF_TARGET = 25;

const COUNTRY_BADGES = [
	{ id: 'country_1', n: 1 },
	{ id: 'country_2', n: 2 },
	{ id: 'country_5', n: 5 },
	{ id: 'country_10', n: 10 }
];

/** Combined FA+FFA distinct-route thresholds (#194). */
const FA_COUNT_BADGES = [
	{ id: 'fa_5', n: 5 },
	{ id: 'fa_10', n: 10 },
	{ id: 'fa_20', n: 20 },
	{ id: 'fa_50', n: 50 },
	{ id: 'fa_100', n: 100 }
] as const;

/** FFA-only distinct-route thresholds (#194). */
const FFA_COUNT_BADGES = [
	{ id: 'ffa_5', n: 5 },
	{ id: 'ffa_10', n: 10 },
	{ id: 'ffa_20', n: 20 },
	{ id: 'ffa_50', n: 50 },
	{ id: 'ffa_100', n: 100 }
] as const;

/** Per-style first-ascent (FA+FFA) thresholds (#194). */
const STYLE_FA_BADGES = [
	{ id: 'fa_sport_10', style: 'Sport', n: 10 },
	{ id: 'fa_sport_20', style: 'Sport', n: 20 },
	{ id: 'fa_sport_50', style: 'Sport', n: 50 },
	{ id: 'fa_trad_10', style: 'Trad', n: 10 },
	{ id: 'fa_trad_20', style: 'Trad', n: 20 },
	{ id: 'fa_trad_50', style: 'Trad', n: 50 },
	{ id: 'fa_boulder_10', style: 'Boulder', n: 10 },
	{ id: 'fa_boulder_20', style: 'Boulder', n: 20 },
	{ id: 'fa_boulder_50', style: 'Boulder', n: 50 }
] as const;

/** Known sent API pitch numbers; null means the legacy columns are the only evidence. */
export function sentPitchNumbersFromRaw(raw: string | null | undefined): number[] | null {
	if (!raw) return null;
	try {
		const data = JSON.parse(raw);
		if (!Array.isArray(data?.pitch) || data.pitch.length === 0) return null;
		return data.pitch.flatMap(
			(p: { number?: number; tick?: { label?: string; name?: string } | null }) =>
				p &&
				Number.isInteger(p.number) &&
				p.number! > 0 &&
				classifyTick(p.tick?.label || p.tick?.name).isSend
					? [p.number!]
					: []
		);
	} catch {
		return null;
	}
}

type PitchCredit = { labels: Set<string>; whole: number };

function pitchCredit(row: DashboardExtraRow): PitchCredit | null {
	if (row.sentPitchNumbers != null) {
		return row.sentPitchNumbers.length
			? { labels: new Set(row.sentPitchNumbers.map((n) => `p${n}`)), whole: 0 }
			: null;
	}
	const label = (row.pitchLabel || '').trim().toLowerCase();
	if (label) {
		const range = /^p(\d+)[–-]p(\d+)$/.exec(label);
		if (range) {
			const start = Number(range[1]),
				end = Number(range[2]);
			if (start > 0 && end >= start && end - start < 1000) {
				return {
					labels: new Set(Array.from({ length: end - start + 1 }, (_, i) => `p${start + i}`)),
					whole: 0
				};
			}
		}
		return {
			labels: new Set(
				label
					.split(',')
					.map((p) => p.trim())
					.filter(Boolean)
			),
			whole: 0
		};
	}
	const total = row.pitchesTotal;
	return total != null && Number.isFinite(total) && total >= 2
		? { labels: new Set(), whole: Math.floor(total) }
		: null;
}

function makeHit(
	row: DashboardExtraRow,
	prefix: string,
	display: DateDisplay,
	locale: SupportedLocale = DEFAULT_LOCALE
): Hit {
	const date = dayKey(row.ascentDate)!;
	const routeName = (row.routeName || '').trim() || null;
	const href = row.ascentUrl || row.url || null;
	const tail = routeLine(routeName, date, display);
	return {
		date,
		routeName,
		href,
		detail: [
			tail ? `${prefix} · ${tail}` : `${prefix} · ${formatBadgeDate(date, display)}`,
			ascentPartners(row.partners, locale)
		]
			.filter(Boolean)
			.join(' · ')
	};
}

/**
 * Evaluate the badge catalog against chronological logbook rows.
 * Pure — no DB. Breaks do not erase earned badges.
 */
function ascentOrder(row: DashboardExtraRow): number {
	const id = row.ascentId;
	return id != null && Number.isFinite(id) ? Number(id) : Number.MAX_SAFE_INTEGER;
}

export function buildBadges(
	rows: DashboardExtraRow[],
	setterHits: readonly SetterBadgeHit[] = [],
	communityHits: readonly CommunityBadgeHit[] = [],
	context: {
		firstImport?: FirstImport | null;
		gradeSystems?: DisplayGradeSystems;
		dateDisplay?: DateDisplay;
		/** Display units for hint/detail wording; thresholds stay metric (#484). */
		displayUnits?: DisplayUnits;
		/** Cached Open-Meteo days keyed by lat|lon|day (#268). */
		weatherByKey?: ReadonlyMap<string, WeatherSnapshot>;
		locale?: SupportedLocale;
	} = {}
): BadgesResult {
	const dateDisplay = context.dateDisplay ?? DEFAULT_DATE_DISPLAY;
	const units = context.displayUnits ?? DEFAULT_DISPLAY_UNITS;
	const locale = context.locale ?? DEFAULT_LOCALE;
	const hit = (row: DashboardExtraRow, prefix: string) => makeHit(row, prefix, dateDisplay, locale);

	// Chronological by day, then stable ascent id — never alphabetise route names
	// (that made “Nacho Libre” beat earlier same-day climbs like “Torched”).
	const dated = [...rows]
		.map((r) => ({ row: r, day: dayKey(r.ascentDate) }))
		.filter((x): x is { row: DashboardExtraRow; day: string } => Boolean(x.day))
		.sort((a, b) => {
			const byDay = a.day.localeCompare(b.day);
			if (byDay !== 0) return byDay;
			const byId = ascentOrder(a.row) - ascentOrder(b.row);
			if (byId !== 0) return byId;
			return (a.row.routeName || '').localeCompare(b.row.routeName || '');
		});

	const earned = new Map<string, Hit>();

	const mark = (id: string, hit: Hit) => {
		if (!earned.has(id)) earned.set(id, hit);
	};

	// Historical runs keep milestones earned after a break; no current-streak counter.
	const runs = consecutiveDayRuns(dated.map(({ day }) => day));
	for (const threshold of STREAK_DAY_THRESHOLDS) {
		const run = runs.find((r) => r.length >= threshold);
		if (!run) continue;
		const day = new Date(Date.parse(`${run.start}T00:00:00Z`) + (threshold - 1) * 86400000)
			.toISOString()
			.slice(0, 10);
		const runHit = dated.find((r) => r.day === day)!;
		mark(
			`streak_days_${threshold}`,
			hit(runHit.row, formatMessage(locale, 'cards.badges.detailStreakDays', { count: threshold }))
		);
	}

	let ascentCount = 0;
	let sendCount = 0;
	let onsightCount = 0;
	let flashCount = 0;
	let weekendSendCount = 0;
	let cumHeight = 0;
	const sessions = new Set<string>();
	const dayHeights = new Map<string, number>();
	const countries = new Set<string>();
	let maxRoute = -Infinity;
	let maxBoulder = -Infinity;
	const faRoutes = new Set<number>();
	let ffaCount = 0;
	const styleFaCounts: Record<'Sport' | 'Trad' | 'Boulder', number> = {
		Sport: 0,
		Trad: 0,
		Boulder: 0
	};

	// #279 state: pitches per day, crags per rolling week, days spent on each route.
	const pitchesByDay = new Map<string, Map<string | number, PitchCredit>>();
	const cragEvents: { t: number; crag: string }[] = [];
	const routeDays = new Map<number, Set<string>>();
	const routeSent = new Set<number>();
	// Repeats vs new routes: first logged day and distinct days per provider route key.
	const routeFirstDay = new Map<string, string>();
	const keyedRouteDays = new Map<string, Set<string>>();
	const cragRepeats = new Map<string, number>();
	let maxRouteDays = 0;
	let maxCragRepeats = 0;

	for (const { row, day } of dated) {
		ascentCount += 1;
		sessions.add(day);
		const climbHeight = heightOf(row);
		cumHeight += climbHeight;
		const dayHeight = (dayHeights.get(day) ?? 0) + climbHeight;
		dayHeights.set(day, dayHeight);

		const country = (row.country || '').trim();
		if (country) countries.add(country.toLowerCase());

		const kind = tickKind(row.tickType);
		const send = Boolean(row.isSend);
		const soloStyle = climbStyleLabel(row.ascentGearStyle);
		const ascentStyle = (row.ascentGearStyle ?? '')
			.trim()
			.toLowerCase()
			.replace(/[\s_-]+/g, ' ');
		if (
			send &&
			!['Free solo', 'Deep water solo', 'Aid', 'Boulder'].includes(soloStyle) &&
			!['second', 'seconding'].includes(ascentStyle) &&
			classifyTick(row.tickType).isSend
		) {
			const solo = soloKind({
				tickType: row.tickType ?? null,
				ascentGearStyle: row.ascentGearStyle ?? null
			});
			if (solo === 'lead' && soloStyle !== 'Top rope')
				mark(
					'first_lead_rope_solo',
					hit(row, formatMessage(locale, 'cards.badges.detailFirstLeadRopeSolo'))
				);
			if (solo === 'toprope')
				mark(
					'first_top_rope_solo',
					hit(row, formatMessage(locale, 'cards.badges.detailFirstTopRopeSolo'))
				);
		}

		if (isGreenpoint(row))
			mark('greenpoint', hit(row, formatMessage(locale, 'cards.badges.detailGreenpoint')));
		const outdoor =
			row.outdoor !== false &&
			!isLikelyIndoorRoute({
				gearStyle: row.gearStyle,
				name: row.routeName,
				cragName: row.cragName,
				tagsJson: row.tagsJson
			});
		if (outdoor && isSunFacingSummer(row))
			mark(
				'sun_facing_summer',
				hit(row, formatMessage(locale, 'cards.badges.detailSunFacingSummer'))
			);
		const monthDay = day.slice(5); // MM-DD from calendar dayKey — no local TZ

		if (sessions.size === 1 && !earned.has('first_session')) {
			mark('first_session', hit(row, formatMessage(locale, 'cards.badges.detailFirstSession')));
		}

		// Holiday badges: any logged ascent that calendar day (attempts count).
		if (monthDay === '12-25') {
			mark('holiday_christmas', hit(row, formatMessage(locale, 'cards.badges.detailChristmasDay')));
		}
		if (monthDay === '12-31' || monthDay === '01-01') {
			mark(
				'holiday_new_year',
				hit(
					row,
					monthDay === '12-31'
						? formatMessage(locale, 'cards.badges.detailNewYearsEve')
						: formatMessage(locale, 'cards.badges.detailNewYearsDay')
				)
			);
		}

		// Keep the indoor guard for callers that do not supply an explicit outdoor flag.
		const weather =
			row.weatherLocation?.source === 'place' || row.weatherLocation?.source === 'polygon'
				? null
				: lookupAscentWeather(context.weatherByKey, { ...row, outdoor });
		if (weather) {
			if (isHeatWeather(weather)) {
				mark(
					'weather_heat',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailHotDay', {
							temp: formatTemperature(weather.tempMaxC, units.temperature)
						})
					)
				);
			}
			if (isFreezeWeather(weather)) {
				mark(
					'weather_freeze',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailColdDay', {
							temp: formatTemperature(weather.tempMinC, units.temperature)
						})
					)
				);
			}
			if (isSnowWeather(weather)) {
				mark('weather_snow', hit(row, formatMessage(locale, 'cards.badges.detailClimbedInSnow')));
			} else if (isRainWeather(weather)) {
				mark(
					'weather_rain',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailRainyDay', {
							precip: formatPrecipitation(weather.precipMm, units.precipitation)
						})
					)
				);
			}
			if (isWindyWeather(weather)) {
				mark(
					'weather_wind',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailWindyDay', {
							wind: formatWind(weather.windMaxKmh, units.wind)
						})
					)
				);
			}
			if (isFairWeather(weather)) {
				mark(
					'weather_bluebird',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailBluebirdDay', {
							temp: formatTemperature(weather.tempMaxC, units.temperature)
						})
					)
				);
			}
			if (isStickyHumidity(weather)) {
				mark(
					'weather_sticky',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailStickyDay', {
							percent: Math.round(weather.humidityMean!)
						})
					)
				);
			}
			if (send && isStormPrecip(weather)) {
				mark(
					'weather_storm_send',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailStormSend', {
							precip: formatPrecipitation(weather.precipMm, units.precipitation)
						})
					)
				);
			}
			if (
				earned.has('weather_heat') &&
				earned.has('weather_freeze') &&
				earned.has('weather_rain') &&
				earned.has('weather_snow') &&
				!earned.has('weather_four_seasons')
			) {
				mark(
					'weather_four_seasons',
					hit(row, formatMessage(locale, 'cards.badges.detailFourSeasons'))
				);
			}
		}

		// Partner / multipitch / travel / persistence badges (#279), from existing row fields.
		const partnerNames = new Set(splitPartners(row.partners).map((n) => n.toLowerCase()));
		if (partnerNames.size >= 3) {
			mark(
				'partners_crowded_belay',
				hit(
					row,
					formatMessage(locale, 'cards.badges.detailCrowdedBelay', {
						count: partnerNames.size
					})
				)
			);
		}

		if (send || row.sentPitchNumbers != null) {
			const pitch = pitchCredit(row);
			if (pitch) {
				const dayPitches = pitchesByDay.get(day) ?? new Map<string | number, PitchCredit>();
				const route = row.routeId ?? row.routeName ?? 'route';
				const current = dayPitches.get(route) ?? { labels: new Set<string>(), whole: 0 };
				for (const label of pitch.labels) current.labels.add(label);
				current.whole = Math.max(current.whole, pitch.whole);
				dayPitches.set(route, current);
				pitchesByDay.set(day, dayPitches);
				const total = [...dayPitches.values()].reduce(
					(n, p) => n + Math.max(p.whole, p.labels.size),
					0
				);
				if (total >= 3)
					mark(
						'multipitch_day',
						hit(row, formatMessage(locale, 'cards.badges.detailMultipitchDay', { count: total }))
					);
			}
		}

		const crag = (row.cragName || '').trim().toLowerCase();
		if (crag && crag !== 'unknown' && outdoor) {
			const t = Math.floor(Date.parse(`${day}T12:00:00Z`) / 86_400_000);
			if (Number.isFinite(t)) {
				cragEvents.push({ t, crag });
				while (cragEvents.length && cragEvents[0]!.t < t - 6) cragEvents.shift();
				const distinct = new Set(cragEvents.map((e) => e.crag));
				if (distinct.size >= 4) {
					mark(
						'travel_week',
						hit(
							row,
							formatMessage(locale, 'cards.badges.detailTravelWeek', { count: distinct.size })
						)
					);
				}
			}
		}

		if (row.routeId != null) {
			const days = routeDays.get(row.routeId) ?? new Set<string>();
			days.add(day);
			routeDays.set(row.routeId, days);
			// Only the first send counts: the route had to be worked, not just repeated.
			if (send && !routeSent.has(row.routeId)) {
				routeSent.add(row.routeId);
				if (days.size >= 4) {
					mark(
						'route_persistence',
						hit(row, formatMessage(locale, 'cards.badges.detailPersistence', { count: days.size }))
					);
				}
			}
		}

		if (row.routeKey) {
			const firstDay = routeFirstDay.get(row.routeKey);
			if (!firstDay) {
				routeFirstDay.set(row.routeKey, day);
				for (const b of DISTINCT_ROUTE_BADGES) {
					if (routeFirstDay.size === b.n)
						mark(
							b.id,
							hit(
								row,
								formatMessage(locale, 'cards.badges.detailDifferentRouteNumber', { count: b.n })
							)
						);
				}
			}
			const days = keyedRouteDays.get(row.routeKey) ?? new Set<string>();
			days.add(day);
			keyedRouteDays.set(row.routeKey, days);
			maxRouteDays = Math.max(maxRouteDays, days.size);
			if (days.size === ROUTE_DAYS_TARGET) {
				mark(
					'route_days_10',
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailDayOnSameRoute', {
							count: ROUTE_DAYS_TARGET
						})
					)
				);
			}
			// A repeat is any ascent on a later day than the route's first logged day.
			if (firstDay && day > firstDay && crag && crag !== 'unknown') {
				const n = (cragRepeats.get(crag) ?? 0) + 1;
				cragRepeats.set(crag, n);
				maxCragRepeats = Math.max(maxCragRepeats, n);
				if (n === HOME_TURF_TARGET) {
					mark(
						'home_turf_25',
						hit(
							row,
							formatMessage(locale, 'cards.badges.detailHomeTurf', {
								count: HOME_TURF_TARGET,
								crag: row.cragName!.trim()
							})
						)
					);
				}
			}
		}

		for (const b of COUNT_BADGES) {
			if (ascentCount === b.n)
				mark(
					b.id,
					hit(row, formatMessage(locale, 'cards.badges.detailLoggedClimbNumber', { count: b.n }))
				);
		}
		for (const b of SESSION_BADGES) {
			if (sessions.size === b.n)
				mark(
					b.id,
					hit(row, formatMessage(locale, 'cards.badges.detailDayOutNumber', { count: b.n }))
				);
		}
		for (const b of HEIGHT_BADGES) {
			if (cumHeight >= b.m && !earned.has(b.id)) {
				mark(
					b.id,
					hit(
						row,
						formatMessage(locale, 'cards.badges.detailDistanceClimbed', {
							distance: formatDistance(b.m / 1000, units.distance)
						})
					)
				);
			}
		}
		if (dayHeight >= 250 && !earned.has('day_height_250')) {
			mark(
				'day_height_250',
				hit(
					row,
					formatMessage(locale, 'cards.badges.detailHeightInOneDay', {
						height: formatHeight(250, units.height)
					})
				)
			);
		}
		for (const b of COUNTRY_BADGES) {
			if (countries.size === b.n && country) {
				mark(
					b.id,
					hit(
						row,
						b.n === 1
							? formatMessage(locale, 'cards.badges.detailClimbedInCountry', { country })
							: formatMessage(locale, 'cards.badges.detailCountriesCount', {
									count: b.n,
									country
								})
					)
				);
			}
		}

		if (!send) continue;

		sendCount += 1;
		if (sendCount === 1) {
			const how =
				kind === 'onsight' || kind === 'flash' || kind === 'redpoint' || kind === 'pinkpoint'
					? kind === 'onsight'
						? formatMessage(locale, 'ticks.onsight')
						: kind === 'flash'
							? formatMessage(locale, 'ticks.flash')
							: kind === 'redpoint'
								? formatMessage(locale, 'ticks.redpoint')
								: formatMessage(locale, 'ticks.pinkpoint')
					: null;
			mark(
				'first_send',
				hit(
					row,
					how
						? formatMessage(locale, 'cards.badges.detailFirstSendHow', { how })
						: formatMessage(locale, 'cards.badges.detailFirstSend')
				)
			);
		}
		for (const b of SEND_BADGES) {
			if (sendCount === b.n)
				mark(
					b.id,
					hit(row, formatMessage(locale, 'cards.badges.detailSendNumber', { count: b.n }))
				);
		}

		if (kind === 'onsight') {
			onsightCount += 1;
			if (onsightCount === 1)
				mark('first_onsight', hit(row, formatMessage(locale, 'cards.badges.detailFirstOnsight')));
			for (const b of ONSIGHT_BADGES) {
				if (onsightCount === b.n)
					mark(
						b.id,
						hit(row, formatMessage(locale, 'cards.badges.detailOnsightedNth', { count: b.n }))
					);
			}
		}
		if (kind === 'flash') {
			flashCount += 1;
			if (flashCount === 1)
				mark('first_flash', hit(row, formatMessage(locale, 'cards.badges.detailFirstFlash')));
			for (const b of FLASH_BADGES) {
				if (flashCount === b.n)
					mark(
						b.id,
						hit(row, formatMessage(locale, 'cards.badges.detailFlashedNth', { count: b.n }))
					);
			}
		}

		if (isWeekend(day)) {
			weekendSendCount += 1;
			if (weekendSendCount === 5)
				mark('weekend_5', hit(row, formatMessage(locale, 'cards.badges.detailWeekend5')));
			if (weekendSendCount === 15)
				mark('weekend_15', hit(row, formatMessage(locale, 'cards.badges.detailWeekend15')));
		}

		const style = (row.gearStyle || '').toLowerCase();
		if (style.includes('sport') && !earned.has('style_sport')) {
			mark('style_sport', hit(row, formatMessage(locale, 'cards.badges.detailFirstSportSend')));
		}
		if (style.includes('trad') && !earned.has('style_trad')) {
			mark('style_trad', hit(row, formatMessage(locale, 'cards.badges.detailFirstTradSend')));
		}
		if (style.includes('boulder') && !earned.has('style_boulder')) {
			mark('style_boulder', hit(row, formatMessage(locale, 'cards.badges.detailFirstBoulderSend')));
		}

		const band = row.gradeBand;
		if (band === 2)
			mark(
				'band_intermediate',
				hit(row, formatMessage(locale, 'cards.badges.detailFirstBandIntermediate'))
			);
		if (band === 3)
			mark(
				'band_experienced',
				hit(row, formatMessage(locale, 'cards.badges.detailFirstBandExperienced'))
			);
		if (band === 4)
			mark('band_expert', hit(row, formatMessage(locale, 'cards.badges.detailFirstBandExpert')));
		if (band === 5)
			mark('band_elite', hit(row, formatMessage(locale, 'cards.badges.detailFirstBandElite')));

		// First send of a route the owner marked FA/FFA dates that first ascent (#194).
		if (row.firstAscent && row.routeId != null && !faRoutes.has(row.routeId)) {
			faRoutes.add(row.routeId);
			const what =
				row.firstAscent === 'FFA'
					? formatMessage(locale, 'cards.badges.detailFirstFreeAscent')
					: formatMessage(locale, 'cards.badges.detailFirstAscent');
			mark(row.firstAscent === 'FFA' ? 'first_ffa' : 'first_fa', hit(row, what));
			for (const b of FA_COUNT_BADGES) {
				if (faRoutes.size === b.n) mark(b.id, hit(row, `${what} #${b.n}`));
			}
			if (row.firstAscent === 'FFA') {
				ffaCount += 1;
				for (const b of FFA_COUNT_BADGES) {
					if (ffaCount === b.n)
						mark(
							b.id,
							hit(row, `${formatMessage(locale, 'cards.badges.detailFirstFreeAscent')} #${b.n}`)
						);
				}
			}
			const faStyle = displayStyle(row.gearStyle);
			if (faStyle === 'Sport' || faStyle === 'Trad' || faStyle === 'Boulder') {
				styleFaCounts[faStyle] += 1;
				const n = styleFaCounts[faStyle];
				const styleFaKey =
					faStyle === 'Sport'
						? 'cards.milestones.faSportCount'
						: faStyle === 'Trad'
							? 'cards.milestones.faTradCount'
							: 'cards.milestones.faBoulderCount';
				for (const b of STYLE_FA_BADGES) {
					if (b.style === faStyle && n === b.n) {
						mark(b.id, hit(row, `${formatMessage(locale, styleFaKey, { count: b.n })} · ${what}`));
					}
				}
			}
		}

		const score = scoreOf(row);
		if (score != null) {
			const n = Math.round(score);
			const boulder = isVScaleRow(row);
			if (boulder) {
				if (n > maxBoulder) {
					maxBoulder = n;
					const label = formatGradeLabel(
						score,
						true,
						context.gradeSystems ?? DEFAULT_DISPLAY_SYSTEMS
					);
					mark(
						'new_high',
						hit(row, formatMessage(locale, 'cards.badges.detailNewBoulderHigh', { grade: label }))
					);
					// Allow new_high to update to latest? Catalog is single badge — keep first high only via mark()
				}
			} else if (n > maxRoute) {
				maxRoute = n;
				if (!earned.has('new_high')) {
					mark(
						'new_high',
						hit(
							row,
							formatMessage(locale, 'cards.badges.detailNewRouteHigh', {
								grade: formatGradeLabel(
									score,
									false,
									context.gradeSystems ?? DEFAULT_DISPLAY_SYSTEMS
								)
							})
						)
					);
				}
			}
		}
	}

	for (let i = 0; i < setterHits.length; i++) {
		const n = i + 1;
		const setterHit = setterHits[i]!;
		const badgeHit: Hit = {
			date: setterHit.date,
			routeName: setterHit.routeName,
			href: setterHit.href,
			detail: setterHit.detail
		};
		if (n === 1) mark('first_setter', badgeHit);
		if (n === 5) mark('setter_5', badgeHit);
		if (n === 10) mark('setter_10', badgeHit);
		if (n === 25) mark('setter_25', badgeHit);
	}

	for (const communityHit of communityHits) {
		// Aggregate cache — never invent an earned day from a stale counter (#146).
		mark(communityHit.id, {
			date: null,
			routeName: null,
			href: null,
			detail: communityHit.detail
		});
	}

	const first = context.firstImport;
	if (first?.at) {
		const display = context.dateDisplay ?? DEFAULT_DATE_DISPLAY;
		const at = first.at;
		// Calendar-day strings (legacy manual corrections) stay UTC noon; timestamps use display TZ.
		const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(at);
		const when = formatDateTime(
			dateOnly ? `${at}T12:00:00Z` : at,
			dateOnly ? { ...display, timeZone: 'UTC' } : display,
			{ month: 'short', day: 'numeric', year: 'numeric' }
		);
		mark('first_moves', {
			date: at,
			routeName: null,
			href: null,
			detail: formatMessage(locale, 'cards.badges.detailFirstMoves', {
				count: formatNumber(first.count, display),
				when
			})
		});
	}

	const cards: BadgeCard[] = BADGE_CATALOG.map((def) => {
		const earnedHit = earned.get(def.id);
		const title = badgeTitle(def, locale);
		const hint = badgeHint(def, units, locale);
		if (!earnedHit) {
			return {
				id: def.id,
				title,
				hint,
				icon: def.icon,
				tone: def.tone,
				earned: false,
				detail: null,
				date: null,
				routeName: null,
				href: null
			};
		}
		return {
			id: def.id,
			title,
			hint,
			icon: def.icon,
			tone: def.tone,
			earned: true,
			detail: earnedHit.detail,
			date: earnedHit.date,
			routeName: earnedHit.routeName,
			href: earnedHit.href
		};
	});

	const earnedCards = cards.filter((c) => c.earned);
	const lockedCards = cards.filter((c) => !c.earned);
	const titleOf = (id: string) => {
		const def = BADGE_CATALOG.find((d) => d.id === id);
		return def ? badgeTitle(def, locale) : id;
	};

	const maxDayHeight = Math.max(0, ...dayHeights.values());
	const almostCandidates: { id: string; title: string; current: number; target: number }[] = [];
	const addAlmost = (id: string, current: number, target: number) => {
		if (earned.has(id)) return;
		almostCandidates.push({ id, title: titleOf(id), current, target });
	};

	for (const b of COUNT_BADGES) addAlmost(b.id, ascentCount, b.n);
	for (const b of SEND_BADGES) addAlmost(b.id, sendCount, b.n);
	for (const b of ONSIGHT_BADGES) addAlmost(b.id, onsightCount, b.n);
	for (const b of FLASH_BADGES) addAlmost(b.id, flashCount, b.n);
	for (const b of SESSION_BADGES) addAlmost(b.id, sessions.size, b.n);
	for (const b of HEIGHT_BADGES) addAlmost(b.id, cumHeight, b.m);
	addAlmost('day_height_250', maxDayHeight, 250);
	for (const b of COUNTRY_BADGES) addAlmost(b.id, countries.size, b.n);
	for (const b of DISTINCT_ROUTE_BADGES) addAlmost(b.id, routeFirstDay.size, b.n);
	addAlmost('route_days_10', maxRouteDays, ROUTE_DAYS_TARGET);
	addAlmost('home_turf_25', maxCragRepeats, HOME_TURF_TARGET);
	addAlmost('weekend_5', weekendSendCount, 5);
	addAlmost('weekend_15', weekendSendCount, 15);
	for (const b of FA_COUNT_BADGES) addAlmost(b.id, faRoutes.size, b.n);
	for (const b of FFA_COUNT_BADGES) addAlmost(b.id, ffaCount, b.n);
	for (const b of STYLE_FA_BADGES) {
		addAlmost(b.id, styleFaCounts[b.style as 'Sport' | 'Trad' | 'Boulder'], b.n);
	}
	addAlmost('setter_5', setterHits.length, 5);
	addAlmost('setter_10', setterHits.length, 10);
	addAlmost('setter_25', setterHits.length, 25);

	return {
		earned: earnedCards,
		locked: lockedCards,
		earnedCount: earnedCards.length,
		totalCount: cards.length,
		almost: rankAlmostBadges(almostCandidates, { limit: 3 })
	};
}
