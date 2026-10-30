import { climbStyleLabel } from '#lib/climbStyle';
import { soloKind } from './solo';
/**
 * RoxClimbs-inspired badges: real milestones from logged data.
 * Taking a break does not erase a milestone — recognition when something genuinely happened.
 */

import { calendarDay as dayKey } from '#lib/calendarDay';
import { formatVScaleLabel, usesVScale } from '#lib/grades';
import { tickKind } from '#lib/ticks';
import { DEFAULT_DATE_DISPLAY, formatDateTime, formatNumber, type DateDisplay } from '#lib/dates';
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

/** Short date for badge cards, e.g. Aug 27, 2018 */
export function formatBadgeDate(iso: string | null | undefined): string {
	const key = dayKey(iso);
	if (!key) return '';
	const d = new Date(`${key}T12:00:00Z`);
	if (Number.isNaN(d.getTime())) return key;
	return d.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		timeZone: 'UTC'
	});
}

function routeLine(name: string | null | undefined, date: string | null): string {
	const n = (name || '').trim();
	const when = formatBadgeDate(date);
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

/** Static catalog — order is display order for locked badges. */
export const BADGE_CATALOG: readonly BadgeDef[] = [
	{
		id: 'first_moves',
		title: 'First Moves',
		hint: 'Import your logbook into Crag Stats',
		icon: 'carabiner',
		tone: 'warm'
	},
	{
		id: 'first_session',
		title: 'First Session',
		hint: 'Complete your first day out',
		icon: 'knot',
		tone: 'warm'
	},
	{
		id: 'first_send',
		title: 'First Send',
		hint: 'Send any route or boulder',
		icon: 'send',
		tone: 'green'
	},
	{
		id: 'first_onsight',
		title: 'First Onsight',
		hint: 'Onsight a route',
		icon: 'eye',
		tone: 'blue'
	},
	{
		id: 'first_flash',
		title: 'First Flash',
		hint: 'Flash a route or boulder',
		icon: 'bolt',
		tone: 'green'
	},
	{
		id: 'ascents_10',
		title: 'Getting Started',
		hint: 'Log 10 ascents',
		icon: 'route',
		tone: 'warm'
	},
	{
		id: 'ascents_25',
		title: 'Quarter Century',
		hint: 'Log 25 ascents',
		icon: 'route',
		tone: 'warm'
	},
	{ id: 'ascents_50', title: 'Fifty Climbs', hint: 'Log 50 ascents', icon: 'route', tone: 'warm' },
	{ id: 'ascents_100', title: 'Century', hint: 'Log 100 ascents', icon: 'star', tone: 'green' },
	{ id: 'ascents_250', title: 'Two-Fifty', hint: 'Log 250 ascents', icon: 'star', tone: 'green' },
	{
		id: 'ascents_500',
		title: 'Half Thousand',
		hint: 'Log 500 ascents',
		icon: 'star',
		tone: 'blue'
	},
	{
		id: 'ascents_1000',
		title: 'Thousand Climbs',
		hint: 'Log 1,000 ascents',
		icon: 'mountain',
		tone: 'purple'
	},
	{ id: 'sends_10', title: 'Ten Sends', hint: 'Send 10 climbs', icon: 'send', tone: 'green' },
	{ id: 'sends_25', title: 'Send Machine', hint: 'Send 25 climbs', icon: 'send', tone: 'green' },
	{ id: 'sends_50', title: 'Fifty Sends', hint: 'Send 50 climbs', icon: 'send', tone: 'blue' },
	{
		id: 'sends_100',
		title: 'Hundred Sends',
		hint: 'Send 100 climbs',
		icon: 'send',
		tone: 'purple'
	},
	{
		id: 'onsight_10',
		title: 'Onsight Specialist',
		hint: 'Onsight 10 routes',
		icon: 'eye',
		tone: 'blue'
	},
	{
		id: 'onsight_25',
		title: 'Onsight Ace',
		hint: 'Onsight 25 routes',
		icon: 'eye',
		tone: 'purple'
	},
	{ id: 'flash_10', title: 'Quick Study', hint: 'Flash 10 climbs', icon: 'bolt', tone: 'green' },
	{ id: 'flash_25', title: 'Flasher', hint: 'Flash 25 climbs', icon: 'bolt', tone: 'green' },
	{
		id: 'weekend_5',
		title: 'Weekend Warrior',
		hint: 'Send on 5 weekend days',
		icon: 'sun',
		tone: 'warm'
	},
	{
		id: 'weekend_15',
		title: 'Weekend Climber',
		hint: 'Send on 15 weekend days',
		icon: 'sun',
		tone: 'green'
	},
	{
		id: 'holiday_christmas',
		title: 'Christmas Day',
		hint: 'Climb on Christmas Day',
		icon: 'calendar',
		tone: 'warm'
	},
	{
		id: 'holiday_new_year',
		title: 'New Year',
		hint: 'Climb on New Year’s Eve or Day',
		icon: 'calendar',
		tone: 'warm'
	},
	{
		id: 'weather_heat',
		title: 'Heat Wave',
		hint: 'Climb outdoors when the day’s high is 35°C or hotter',
		icon: 'thermometer',
		tone: 'warm'
	},
	{
		id: 'weather_freeze',
		title: 'Freeze Frame',
		hint: 'Climb outdoors when the day’s low is 0°C or colder',
		icon: 'snowflake',
		tone: 'blue'
	},
	{
		id: 'weather_rain',
		title: 'Rain Check',
		hint: 'Climb outdoors on a day with at least 1 mm of rain',
		icon: 'droplet',
		tone: 'blue'
	},
	{
		id: 'weather_snow',
		title: 'Climbing in the Snow',
		hint: 'Climb outdoors on a snowy day',
		icon: 'snowflake',
		tone: 'purple'
	},
	{
		id: 'weather_wind',
		title: 'Blown Away',
		hint: 'Climb outdoors when the day’s max wind is 50 km/h or stronger',
		icon: 'wind',
		tone: 'slate'
	},
	{
		id: 'weather_bluebird',
		title: 'Bluebird',
		hint: 'Climb outdoors on a pleasant dry day (high 15–25°C, little precip)',
		icon: 'sun',
		tone: 'blue'
	},
	{
		id: 'weather_sticky',
		title: 'Sticky',
		hint: 'Climb outdoors when mean humidity is 85% or higher',
		icon: 'droplet',
		tone: 'green'
	},
	{
		id: 'weather_storm_send',
		title: 'Storm Send',
		hint: 'Send outdoors on a day with at least 10 mm of non-snow rain',
		icon: 'bolt',
		tone: 'purple'
	},
	{
		id: 'weather_four_seasons',
		title: 'Four Seasons',
		hint: 'Earn Heat Wave, Freeze Frame, Rain Check, and Climbing in the Snow',
		icon: 'globe',
		tone: 'warm'
	},
	{
		id: 'partners_crowded_belay',
		title: 'Crowded Belay',
		hint: 'Log an ascent with 3 or more partners',
		icon: 'carabiner',
		tone: 'green'
	},
	{
		id: 'multipitch_day',
		title: 'Multipitch Day',
		hint: 'Send 3 or more pitches in one day',
		icon: 'route',
		tone: 'blue'
	},
	{
		id: 'travel_week',
		title: 'Travel Week',
		hint: 'Climb at 4 different crags within 7 days',
		icon: 'globe',
		tone: 'warm'
	},
	{
		id: 'route_persistence',
		title: 'Persistence Pays',
		hint: 'Send a route after working it over 4 or more different days',
		icon: 'knot',
		tone: 'purple'
	},
	{
		id: 'greenpoint',
		title: 'Greenpoint',
		hint: 'Greenpoint a sport route, or send one with a clean lead recorded as Trad.',
		icon: 'knot',
		tone: 'green'
	},
	{
		id: 'first_lead_rope_solo',
		title: 'First Lead Rope Solo',
		hint: 'Complete your first explicitly logged lead rope-solo ascent.',
		icon: 'carabiner',
		tone: 'blue'
	},
	{
		id: 'first_top_rope_solo',
		title: 'First Top-Rope Solo',
		hint: 'Complete your first explicitly logged top-rope solo ascent.',
		icon: 'knot',
		tone: 'purple'
	},
	{
		id: 'sessions_10',
		title: 'Regular',
		hint: 'Climb on 10 different days',
		icon: 'calendar',
		tone: 'warm'
	},
	{
		id: 'sessions_50',
		title: 'Dedicated',
		hint: 'Climb on 50 different days',
		icon: 'calendar',
		tone: 'green'
	},
	{
		id: 'sessions_100',
		title: 'Hundred Days',
		hint: 'Climb on 100 different days',
		icon: 'calendar',
		tone: 'blue'
	},
	{
		id: 'height_1km',
		title: 'Kilometre Climber',
		hint: 'Climb a cumulative 1 km',
		icon: 'mountain',
		tone: 'warm'
	},
	{
		id: 'height_5km',
		title: 'Five K Vertical',
		hint: 'Climb a cumulative 5 km',
		icon: 'mountain',
		tone: 'green'
	},
	{
		id: 'height_10km',
		title: 'Ten K Vertical',
		hint: 'Climb a cumulative 10 km',
		icon: 'mountain',
		tone: 'blue'
	},
	{
		id: 'height_20km',
		title: 'Twenty K Vertical',
		hint: 'Climb a cumulative 20 km',
		icon: 'mountain',
		tone: 'purple'
	},
	{
		id: 'day_height_250',
		title: '250m Day',
		hint: 'Climb 250 m in a single day',
		icon: 'mountain',
		tone: 'green'
	},
	{
		id: 'country_1',
		title: 'Home Crag Country',
		hint: 'Climb in a logged country',
		icon: 'flag',
		tone: 'warm'
	},
	{
		id: 'country_2',
		title: 'Two Countries',
		hint: 'Climb in 2 countries',
		icon: 'globe',
		tone: 'green'
	},
	{
		id: 'country_5',
		title: 'Globe Trotter',
		hint: 'Climb in 5 countries',
		icon: 'globe',
		tone: 'blue'
	},
	{
		id: 'country_10',
		title: 'World Traveller',
		hint: 'Climb in 10 countries',
		icon: 'globe',
		tone: 'purple'
	},
	{
		id: 'style_sport',
		title: 'Sport Starter',
		hint: 'Send a sport route',
		icon: 'carabiner',
		tone: 'blue'
	},
	{
		id: 'style_trad',
		title: 'Trad Curious',
		hint: 'Send a trad route',
		icon: 'knot',
		tone: 'warm'
	},
	{
		id: 'style_boulder',
		title: 'Boulder Start',
		hint: 'Send a boulder problem',
		icon: 'route',
		tone: 'green'
	},
	{
		id: 'band_intermediate',
		title: 'Intermediate',
		hint: 'Send an Intermediate-band climb',
		icon: 'star',
		tone: 'warm'
	},
	{
		id: 'band_experienced',
		title: 'Experienced',
		hint: 'Send an Experienced-band climb',
		icon: 'star',
		tone: 'green'
	},
	{
		id: 'band_expert',
		title: 'Expert',
		hint: 'Send an Expert-band climb',
		icon: 'star',
		tone: 'blue'
	},
	{
		id: 'band_elite',
		title: 'Elite',
		hint: 'Send an Elite-band climb',
		icon: 'star',
		tone: 'purple'
	},
	{
		id: 'new_high',
		title: 'New High',
		hint: 'Set a personal grade high',
		icon: 'flag',
		tone: 'green'
	},
	// First ascents rely on the owner marking FA/FFA in the logbook (theCrag's API has no
	// route history); each is dated by the first send of the marked route (#194 thresholds).
	{
		id: 'first_fa',
		title: 'First Ascent',
		hint: 'Send a route and mark it as your FA in the logbook',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'first_ffa',
		title: 'First Free Ascent',
		hint: 'Send a route and mark it as your FFA in the logbook',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'fa_5',
		title: '5 First Ascents',
		hint: 'Log 5 first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'warm'
	},
	{
		id: 'fa_10',
		title: 'Pioneer',
		hint: 'Log 10 first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'fa_20',
		title: '20 First Ascents',
		hint: 'Log 20 first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'green'
	},
	{
		id: 'fa_50',
		title: '50 First Ascents',
		hint: 'Log 50 first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'fa_100',
		title: '100 First Ascents',
		hint: 'Log 100 first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'ffa_5',
		title: '5 First Free Ascents',
		hint: 'Log 5 first free ascents',
		icon: 'hanger',
		tone: 'warm'
	},
	{
		id: 'ffa_10',
		title: '10 First Free Ascents',
		hint: 'Log 10 first free ascents',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'ffa_20',
		title: '20 First Free Ascents',
		hint: 'Log 20 first free ascents',
		icon: 'hanger',
		tone: 'green'
	},
	{
		id: 'ffa_50',
		title: '50 First Free Ascents',
		hint: 'Log 50 first free ascents',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'ffa_100',
		title: '100 First Free Ascents',
		hint: 'Log 100 first free ascents',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'fa_sport_10',
		title: '10 Sport First Ascents',
		hint: 'Log 10 sport first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'fa_sport_20',
		title: '20 Sport First Ascents',
		hint: 'Log 20 sport first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'fa_sport_50',
		title: '50 Sport First Ascents',
		hint: 'Log 50 sport first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'blue'
	},
	{
		id: 'fa_trad_10',
		title: '10 Trad First Ascents',
		hint: 'Log 10 trad first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'warm'
	},
	{
		id: 'fa_trad_20',
		title: '20 Trad First Ascents',
		hint: 'Log 20 trad first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'warm'
	},
	{
		id: 'fa_trad_50',
		title: '50 Trad First Ascents',
		hint: 'Log 50 trad first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'warm'
	},
	{
		id: 'fa_boulder_10',
		title: '10 Boulder First Ascents',
		hint: 'Log 10 boulder first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'fa_boulder_20',
		title: '20 Boulder First Ascents',
		hint: 'Log 20 boulder first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'fa_boulder_50',
		title: '50 Boulder First Ascents',
		hint: 'Log 50 boulder first ascents (FA or FFA)',
		icon: 'hanger',
		tone: 'purple'
	},
	{
		id: 'first_setter',
		title: 'Route Setter',
		hint: 'Credited as route setter on a route you bolted or set',
		icon: 'bolt',
		tone: 'warm'
	},
	{
		id: 'setter_5',
		title: 'Route Developer',
		hint: 'Credited as route setter on 5 different routes',
		icon: 'bolt',
		tone: 'green'
	},
	{
		id: 'setter_10',
		title: 'Wall Builder',
		hint: 'Credited as route setter on 10 different routes',
		icon: 'bolt',
		tone: 'blue'
	},
	{
		id: 'setter_25',
		title: 'Crag Architect',
		hint: 'Credited as route setter on 25 different routes',
		icon: 'bolt',
		tone: 'purple'
	},
	// Community ticks on routes you put up — cached paired estimates (#146); no earned date.
	{
		id: 'community_10',
		title: 'Shared Crag',
		hint: '~10 community ascents on routes you put up (estimate)',
		icon: 'globe',
		tone: 'warm'
	},
	{
		id: 'community_50',
		title: 'Crowd Pleaser',
		hint: '~50 community ascents on routes you put up (estimate)',
		icon: 'globe',
		tone: 'green'
	},
	{
		id: 'community_100',
		title: 'Hundred Hands',
		hint: '~100 community ascents on routes you put up (estimate)',
		icon: 'globe',
		tone: 'blue'
	},
	{
		id: 'community_500',
		title: 'Local Classic',
		hint: '~500 community ascents on routes you put up (estimate)',
		icon: 'globe',
		tone: 'purple'
	},
	{
		id: 'community_sport_10',
		title: 'Bolted Buzz',
		hint: '~10 community ascents on your sport/bolted routes (estimate)',
		icon: 'carabiner',
		tone: 'warm'
	},
	{
		id: 'community_sport_50',
		title: 'Sport Magnet',
		hint: '~50 community ascents on your sport/bolted routes (estimate)',
		icon: 'carabiner',
		tone: 'green'
	},
	{
		id: 'community_sport_100',
		title: 'Clip Classic',
		hint: '~100 community ascents on your sport/bolted routes (estimate)',
		icon: 'carabiner',
		tone: 'blue'
	}
] as const;

const COUNT_BADGES: { id: string; n: number; label: (n: number) => string }[] = [
	{ id: 'ascents_10', n: 10, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_25', n: 25, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_50', n: 50, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_100', n: 100, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_250', n: 250, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_500', n: 500, label: (n) => `Logged climb #${n}` },
	{ id: 'ascents_1000', n: 1000, label: (n) => `Logged climb #${n}` }
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

const HEIGHT_BADGES = [
	{ id: 'height_1km', m: 1000, label: '1 km climbed' },
	{ id: 'height_5km', m: 5000, label: '5 km climbed' },
	{ id: 'height_10km', m: 10000, label: '10 km climbed' },
	{ id: 'height_20km', m: 20000, label: '20 km climbed' }
];

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

function hitAt(row: DashboardExtraRow, prefix: string): Hit {
	const date = dayKey(row.ascentDate)!;
	const routeName = (row.routeName || '').trim() || null;
	const href = row.ascentUrl || row.url || null;
	const tail = routeLine(routeName, date);
	return {
		date,
		routeName,
		href,
		detail: tail ? `${prefix} · ${tail}` : `${prefix} · ${formatBadgeDate(date)}`
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
		dateDisplay?: DateDisplay;
		/** Cached Open-Meteo days keyed by lat|lon|day (#268). */
		weatherByKey?: ReadonlyMap<string, WeatherSnapshot>;
	} = {}
): BadgesResult {
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
		if (
			send &&
			!['Free solo', 'Deep water solo', 'Aid'].includes(soloStyle) &&
			classifyTick(row.tickType).isSend
		) {
			const solo = soloKind({
				tickType: row.tickType ?? null,
				ascentGearStyle: row.ascentGearStyle ?? null
			});
			if (solo === 'lead' && soloStyle !== 'Top rope')
				mark('first_lead_rope_solo', hitAt(row, 'First completed lead rope solo'));
			if (solo === 'toprope')
				mark('first_top_rope_solo', hitAt(row, 'First completed top-rope solo'));
		}

		if (isGreenpoint(row)) mark('greenpoint', hitAt(row, 'Sport route led on trad protection'));
		const outdoor =
			row.outdoor !== false &&
			!isLikelyIndoorRoute({
				gearStyle: row.gearStyle,
				name: row.routeName,
				cragName: row.cragName,
				tagsJson: row.tagsJson
			});
		const monthDay = day.slice(5); // MM-DD from calendar dayKey — no local TZ

		if (sessions.size === 1 && !earned.has('first_session')) {
			mark('first_session', hitAt(row, 'First session done'));
		}

		// Holiday badges: any logged ascent that calendar day (attempts count).
		if (monthDay === '12-25') {
			mark('holiday_christmas', hitAt(row, 'Climbed on Christmas Day'));
		}
		if (monthDay === '12-31' || monthDay === '01-01') {
			mark(
				'holiday_new_year',
				hitAt(row, monthDay === '12-31' ? 'Climbed on New Year’s Eve' : 'Climbed on New Year’s Day')
			);
		}

		// Keep the indoor guard for callers that do not supply an explicit outdoor flag.
		const weather =
			row.weatherLocation?.source === 'place'
				? null
				: lookupAscentWeather(context.weatherByKey, { ...row, outdoor });
		if (weather) {
			if (isHeatWeather(weather)) {
				mark('weather_heat', hitAt(row, `Hot day · ${Math.round(weather.tempMaxC!)}°C high`));
			}
			if (isFreezeWeather(weather)) {
				mark('weather_freeze', hitAt(row, `Cold day · ${Math.round(weather.tempMinC!)}°C low`));
			}
			if (isSnowWeather(weather)) {
				mark('weather_snow', hitAt(row, 'Climbed in the snow'));
			} else if (isRainWeather(weather)) {
				mark('weather_rain', hitAt(row, `Rainy day · ${weather.precipMm!.toFixed(1)} mm`));
			}
			if (isWindyWeather(weather)) {
				mark('weather_wind', hitAt(row, `Windy day · ${Math.round(weather.windMaxKmh!)} km/h max`));
			}
			if (isFairWeather(weather)) {
				mark(
					'weather_bluebird',
					hitAt(row, `Bluebird day · ${Math.round(weather.tempMaxC!)}°C high`)
				);
			}
			if (isStickyHumidity(weather)) {
				mark(
					'weather_sticky',
					hitAt(row, `Sticky day · ${Math.round(weather.humidityMean!)}% humidity`)
				);
			}
			if (send && isStormPrecip(weather)) {
				mark('weather_storm_send', hitAt(row, `Storm send · ${weather.precipMm!.toFixed(1)} mm`));
			}
			if (
				earned.has('weather_heat') &&
				earned.has('weather_freeze') &&
				earned.has('weather_rain') &&
				earned.has('weather_snow') &&
				!earned.has('weather_four_seasons')
			) {
				mark('weather_four_seasons', hitAt(row, 'Heat, freeze, rain, and snow'));
			}
		}

		// Partner / multipitch / travel / persistence badges (#279), from existing row fields.
		const partnerNames = new Set(splitPartners(row.partners).map((n) => n.toLowerCase()));
		if (partnerNames.size >= 3) {
			mark('partners_crowded_belay', hitAt(row, `Crowded belay · ${partnerNames.size} partners`));
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
				if (total >= 3) mark('multipitch_day', hitAt(row, `Multipitch day · ${total} pitches`));
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
					mark('travel_week', hitAt(row, `Travel week · ${distinct.size} crags in 7 days`));
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
					mark('route_persistence', hitAt(row, `Sent after ${days.size} days on it`));
				}
			}
		}

		for (const b of COUNT_BADGES) {
			if (ascentCount === b.n) mark(b.id, hitAt(row, b.label(b.n)));
		}
		for (const b of SESSION_BADGES) {
			if (sessions.size === b.n) mark(b.id, hitAt(row, `Day out #${b.n}`));
		}
		for (const b of HEIGHT_BADGES) {
			if (cumHeight >= b.m && !earned.has(b.id)) mark(b.id, hitAt(row, b.label));
		}
		if (dayHeight >= 250 && !earned.has('day_height_250')) {
			mark('day_height_250', hitAt(row, '250 m in one day'));
		}
		for (const b of COUNTRY_BADGES) {
			if (countries.size === b.n && country) {
				mark(
					b.id,
					hitAt(row, b.n === 1 ? `Climbed in ${country}` : `${b.n} countries · ${country}`)
				);
			}
		}

		if (!send) continue;

		sendCount += 1;
		if (sendCount === 1) {
			const how =
				kind === 'onsight' || kind === 'flash' || kind === 'redpoint' || kind === 'pinkpoint'
					? kind === 'onsight'
						? 'Onsight'
						: kind === 'flash'
							? 'Flash'
							: kind === 'redpoint'
								? 'Red point'
								: 'Pink point'
					: null;
			mark('first_send', hitAt(row, how ? `First send (${how})` : 'First send'));
		}
		for (const b of SEND_BADGES) {
			if (sendCount === b.n) mark(b.id, hitAt(row, `Send #${b.n}`));
		}

		if (kind === 'onsight') {
			onsightCount += 1;
			if (onsightCount === 1) mark('first_onsight', hitAt(row, 'First onsight'));
			for (const b of ONSIGHT_BADGES) {
				if (onsightCount === b.n) mark(b.id, hitAt(row, `Onsighted your ${b.n}th route`));
			}
		}
		if (kind === 'flash') {
			flashCount += 1;
			if (flashCount === 1) mark('first_flash', hitAt(row, 'First flash'));
			for (const b of FLASH_BADGES) {
				if (flashCount === b.n) mark(b.id, hitAt(row, `Flashed your ${b.n}th route`));
			}
		}

		if (isWeekend(day)) {
			weekendSendCount += 1;
			if (weekendSendCount === 5) mark('weekend_5', hitAt(row, 'Your 5th weekend send'));
			if (weekendSendCount === 15) mark('weekend_15', hitAt(row, 'Your 15th weekend send'));
		}

		const style = (row.gearStyle || '').toLowerCase();
		if (style.includes('sport') && !earned.has('style_sport')) {
			mark('style_sport', hitAt(row, 'First sport send'));
		}
		if (style.includes('trad') && !earned.has('style_trad')) {
			mark('style_trad', hitAt(row, 'First trad send'));
		}
		if (style.includes('boulder') && !earned.has('style_boulder')) {
			mark('style_boulder', hitAt(row, 'First boulder send'));
		}

		const band = row.gradeBand;
		if (band === 2) mark('band_intermediate', hitAt(row, 'First Intermediate-band send'));
		if (band === 3) mark('band_experienced', hitAt(row, 'First Experienced-band send'));
		if (band === 4) mark('band_expert', hitAt(row, 'First Expert-band send'));
		if (band === 5) mark('band_elite', hitAt(row, 'First Elite-band send'));

		// First send of a route the owner marked FA/FFA dates that first ascent (#194).
		if (row.firstAscent && row.routeId != null && !faRoutes.has(row.routeId)) {
			faRoutes.add(row.routeId);
			const what = row.firstAscent === 'FFA' ? 'First free ascent' : 'First ascent';
			mark(row.firstAscent === 'FFA' ? 'first_ffa' : 'first_fa', hitAt(row, what));
			for (const b of FA_COUNT_BADGES) {
				if (faRoutes.size === b.n) mark(b.id, hitAt(row, `${what} #${b.n}`));
			}
			if (row.firstAscent === 'FFA') {
				ffaCount += 1;
				for (const b of FFA_COUNT_BADGES) {
					if (ffaCount === b.n) mark(b.id, hitAt(row, `First free ascent #${b.n}`));
				}
			}
			const faStyle = displayStyle(row.gearStyle);
			if (faStyle === 'Sport' || faStyle === 'Trad' || faStyle === 'Boulder') {
				styleFaCounts[faStyle] += 1;
				const n = styleFaCounts[faStyle];
				for (const b of STYLE_FA_BADGES) {
					if (b.style === faStyle && n === b.n) {
						mark(b.id, hitAt(row, `${b.n} ${faStyle.toLowerCase()} first ascents · ${what}`));
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
					const label = formatVScaleLabel(n);
					mark('new_high', hitAt(row, `New boulder high · ${label}`));
					// Allow new_high to update to latest? Catalog is single badge — keep first high only via mark()
				}
			} else if (n > maxRoute) {
				maxRoute = n;
				if (!earned.has('new_high')) {
					mark('new_high', hitAt(row, `New route high · ${n}`));
				}
			}
		}
	}

	for (let i = 0; i < setterHits.length; i++) {
		const n = i + 1;
		const hit = setterHits[i]!;
		const badgeHit: Hit = {
			date: hit.date,
			routeName: hit.routeName,
			href: hit.href,
			detail: hit.detail
		};
		if (n === 1) mark('first_setter', badgeHit);
		if (n === 5) mark('setter_5', badgeHit);
		if (n === 10) mark('setter_10', badgeHit);
		if (n === 25) mark('setter_25', badgeHit);
	}

	for (const hit of communityHits) {
		// Aggregate cache — never invent an earned day from a stale counter (#146).
		mark(hit.id, {
			date: null,
			routeName: null,
			href: null,
			detail: hit.detail
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
			detail: `Imported ${formatNumber(first.count, display)} climbs · ${when}`
		});
	}

	const cards: BadgeCard[] = BADGE_CATALOG.map((def) => {
		const hit = earned.get(def.id);
		if (!hit) {
			return {
				id: def.id,
				title: def.title,
				hint: def.hint,
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
			title: def.title,
			hint: def.hint,
			icon: def.icon,
			tone: def.tone,
			earned: true,
			detail: hit.detail,
			date: hit.date,
			routeName: hit.routeName,
			href: hit.href
		};
	});

	const earnedCards = cards.filter((c) => c.earned);
	const lockedCards = cards.filter((c) => !c.earned);
	const titleOf = (id: string) => BADGE_CATALOG.find((d) => d.id === id)?.title ?? id;

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
