/**
 * RoxClimbs-inspired badges: real milestones from logged data.
 * Taking a break does not erase a milestone — recognition when something genuinely happened.
 */
import { formatVScaleLabel, usesVScale } from '#lib/grades';
import { tickKind } from '#lib/ticks';
import { DEFAULT_DATE_DISPLAY, formatDateTime, formatNumber, type DateDisplay } from '#lib/dates';
import type { FirstImport } from './firstImport';
import type { CommunityBadgeHit } from './communityBadges';
import type { DashboardExtraRow } from './dashboardExtras';

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
	| 'hanger';

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
};

type Hit = {
	date: string | null;
	routeName: string | null;
	href: string | null;
	detail: string;
};

function dayKey(d: string | null | undefined): string | null {
	if (!d) return null;
	const t = d.trim();
	if (t.length < 10) return null;
	const key = t.slice(0, 10);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
	if (key.endsWith('-00-00') || key.includes('-00-')) return null;
	return key;
}

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
	// route history); each is dated by the first send of the marked route.
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
	context: { firstImport?: FirstImport | null; dateDisplay?: DateDisplay } = {}
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
	const countries = new Set<string>();
	let maxRoute = -Infinity;
	let maxBoulder = -Infinity;
	const faRoutes = new Set<number>();

	for (const { row, day } of dated) {
		ascentCount += 1;
		sessions.add(day);
		cumHeight += heightOf(row);

		const country = (row.country || '').trim();
		if (country) countries.add(country.toLowerCase());

		const kind = tickKind(row.tickType);
		const send = Boolean(row.isSend);

		if (sessions.size === 1 && !earned.has('first_session')) {
			mark('first_session', hitAt(row, 'First session done'));
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

		// First send of a route the owner marked FA/FFA dates that first ascent.
		if (row.firstAscent && row.routeId != null && !faRoutes.has(row.routeId)) {
			faRoutes.add(row.routeId);
			const what = row.firstAscent === 'FFA' ? 'First free ascent' : 'First ascent';
			mark(row.firstAscent === 'FFA' ? 'first_ffa' : 'first_fa', hitAt(row, what));
			if (faRoutes.size === 5) mark('fa_5', hitAt(row, `${what} #5`));
			if (faRoutes.size === 10) mark('fa_10', hitAt(row, `${what} #10`));
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
	if (first?.at || first?.legacy || (!first && rows.length > 0)) {
		const display = context.dateDisplay ?? DEFAULT_DATE_DISPLAY;
		const at = first?.at ?? null;
		// A manually supplied date is a calendar day; timestamps use the owner's time zone.
		const dateOnly = at && /^\d{4}-\d{2}-\d{2}$/.test(at);
		const when = at
			? formatDateTime(
					dateOnly ? `${at}T12:00:00Z` : at,
					dateOnly ? { ...display, timeZone: 'UTC' } : display,
					{ month: 'short', day: 'numeric', year: 'numeric' }
				)
			: 'Import date unknown';
		mark('first_moves', {
			date: at,
			routeName: null,
			href: null,
			detail: `Imported ${formatNumber(first?.count ?? rows.length, display)} climbs · ${when}`
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

	return {
		earned: earnedCards,
		locked: lockedCards,
		earnedCount: earnedCards.length,
		totalCount: cards.length
	};
}
