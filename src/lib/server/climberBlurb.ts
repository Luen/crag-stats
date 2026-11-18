/**
 * Climbing story copy (#186). Core tenure/volume/identity paragraphs, then up to a few
 * optional personality lines when the signal is strong — never a second dashboard dump.
 */
import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
import { DEFAULT_LOCALE, formatMessage, monthLabels, type SupportedLocale } from '#lib/i18n';
import { formatDistance, formatTemperature, type DisplayUnits } from '#lib/units';
import type { WeatherConditionsView } from '#lib/weatherStats';
import type { StoryRouteLink } from '#lib/types/climbingStory';
import { theCragRouteUrl } from '#lib/thecragUrls';
import { isSportOrBolted, type DeveloperImpactRoute } from './routeDeveloperImpact';

const MAJORITY = 0.55;
const HOME_CRAG_SHARE = 0.4;
const WANDER_MAX_SHARE = 0.25;
const SEASON_SHARE = 0.4;
const PARTNER_MIN = 10;
const SOLO_MIN = 3;
const PROJECTS_MIN = 2;
const POP_SHARE = 0.55;
const POP_MIN_WITH_DATA = 20;
const DEVELOPER_ROUTES_MIN = 2;
const DEVELOPER_IMPACT_MIN = 10;
/** Put-up character (#395): quiet community traffic on a developed route. */
const PUT_UP_OBSCURE_MAX_OTHERS = 5;
/** Put-up character: busy community traffic (aligned with popularity busy ≈ 50). */
const PUT_UP_CLASSIC_MIN_OTHERS = 50;
/** Flourish on the single most-climbed put-up (aligned with community_100). */
const PUT_UP_MEGA_ROUTE_OTHERS = 100;
const PUT_UP_CHARACTER_MIN_WITH_DATA = 2;
const MAX_OPTIONAL = 3;
/** Weather lines need enough cached outdoor days, and most of them covered (#275). */
export const WEATHER_STORY_MIN_DAYS = 20;
export const WEATHER_STORY_MIN_COVERAGE = 0.5;
const WEATHER_COLD_SHARE = 25;
const WEATHER_HEAT_SHARE = 15;
const WEATHER_RAIN_SHARE = 20;
const WEATHER_SNOW_MIN_DAYS = 3;
const WEATHER_RANGE_MIN_C = 30;

/** Sport → Trad → Boulder (boulders are easy to put up, so deprioritise). */
export const PUT_UP_STYLE_PRIORITY = ['Sport', 'Trad', 'Boulder'] as const;
export type PutUpStyle = (typeof PUT_UP_STYLE_PRIORITY)[number];

export type ClimberBlurbInput = {
	firstDate: string | null;
	activeDays: number;
	totalAscents: number;
	totalSends: number;
	onsightCount: number;
	flashCount: number;
	redpointCount: number;
	pinkpointCount: number;
	climberType: string;
	heightM: number;
	displayUnits?: DisplayUnits;
	distinctRoutes: number;
	distinctCrags: number;
	outdoorAscents: number | null;
	indoorAscents: number | null;
	/** Optional personality inputs — omit or leave empty when unknown. */
	topCrags?: { crag: string; count: number }[];
	partners?: { name: string; count: number }[];
	/** Active-day ISO dates (YYYY-MM-DD) for seasonality. */
	activeDayDates?: string[];
	soloByKind?: { kind: string; count: number }[];
	openProjects?: number;
	hardestRouteLabel?: string | null;
	hardestBoulderLabel?: string | null;
	popularity?: { busyPct: number; quietPct: number; withData: number } | null;
	countries?: number;
	rockBlurb?: string | null;
	putUpRoutes?: readonly DeveloperImpactRoute[];
	firstAscentCount?: number;
	/** Outdoor weather summary (#272); null/absent until the weather cache has enough days. */
	weather?: WeatherConditionsView | null;
	dateDisplay?: DateDisplay;
	locale?: SupportedLocale;
};

export type ClimberBlurb = {
	startedOn: string | null;
	durationLabel: string | null;
	paragraphs: string[];
	routeLink: StoryRouteLink | null;
};

/** First-go vs worked-route preference from tick mix. */
export function describeSendPreference(
	input: {
		onsightCount: number;
		flashCount: number;
		redpointCount: number;
		pinkpointCount: number;
		totalSends: number;
	},
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const firstGo = input.onsightCount + input.flashCount;
	const worked = input.redpointCount + input.pinkpointCount;
	const classified = firstGo + worked;
	if (classified === 0) return formatMessage(locale, 'cards.climberBlurb.prefMixed');
	const firstGoShare = firstGo / classified;
	const workedShare = worked / classified;
	if (firstGoShare >= MAJORITY) return formatMessage(locale, 'cards.climberBlurb.prefOnsight');
	if (workedShare >= MAJORITY) return formatMessage(locale, 'cards.climberBlurb.prefRedpoint');
	return formatMessage(locale, 'cards.climberBlurb.prefMixed');
}

const CLIMBER_TYPE_KEYS: Record<string, string> = {
	'sport climber': 'cards.climberTypeBar.typeSport',
	'trad climber': 'cards.climberTypeBar.typeTrad',
	'boulder climber': 'cards.climberBlurb.typeBoulderClimber',
	'rock climber': 'cards.climberTypeBar.typeRock'
};

export function climberTypeSentence(
	climberType: string,
	preference: string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const fallbackRock = formatMessage(locale, 'cards.climberTypeBar.typeRock');
	const type = (climberType || fallbackRock).trim() || fallbackRock;
	const typeKey = CLIMBER_TYPE_KEYS[type.toLowerCase()];
	const labeled = typeKey
		? formatMessage(locale, typeKey)
		: /climber$/i.test(type)
			? type
			: formatMessage(locale, 'cards.climberBlurb.typeFallback', { type });
	return formatMessage(locale, 'cards.climberBlurb.identitySentence', {
		type: labeled,
		preference
	});
}

export function classifyPutUpStyle(
	gearStyle: string | null | undefined,
	bolts: number | null | undefined,
	sportOrBolted?: boolean
): PutUpStyle | null {
	// Explicit gear style wins; bolts / the sportOrBolted flag only classify routes with no style.
	const s = (gearStyle ?? '').trim().toLowerCase();
	if (s) {
		if (s.includes('sport')) return 'Sport';
		if (s.includes('trad')) return 'Trad';
		if (s.includes('boulder')) return 'Boulder';
		return null;
	}
	return sportOrBolted || isSportOrBolted(gearStyle, bolts) ? 'Sport' : null;
}

export type PutUpCharacter = 'obscure' | 'classic';

/**
 * Majority character of put-up routes from community othersAscents (#395).
 * Needs ≥2 routes with data; obscure ≤5 others, classic ≥50. When both clear the
 * majority bar, the higher share wins; a tie prefers classic (obscure must win outright).
 */
export function putUpCharacter(routes: readonly DeveloperImpactRoute[]): PutUpCharacter | null {
	const withData: number[] = [];
	for (const r of routes) {
		if (r.othersAscents == null || !Number.isFinite(r.othersAscents)) continue;
		withData.push(Math.max(0, Math.floor(r.othersAscents)));
	}
	if (withData.length < PUT_UP_CHARACTER_MIN_WITH_DATA) return null;

	let obscure = 0;
	let classic = 0;
	for (const n of withData) {
		if (n <= PUT_UP_OBSCURE_MAX_OTHERS) obscure += 1;
		if (n >= PUT_UP_CLASSIC_MIN_OTHERS) classic += 1;
	}
	const obscureShare = obscure / withData.length;
	const classicShare = classic / withData.length;
	if (obscureShare >= MAJORITY && obscureShare > classicShare) return 'obscure';
	if (classicShare >= MAJORITY) return 'classic';
	if (obscureShare >= MAJORITY) return 'obscure';
	return null;
}

/** Named top put-up by othersAscents; mega flourish at ≥100 community others. */
function mostPopularPutUp(routes: readonly DeveloperImpactRoute[]): DeveloperImpactRoute | null {
	let best: DeveloperImpactRoute | null = null;
	for (const r of routes) {
		if (r.othersAscents == null || !Number.isFinite(r.othersAscents)) continue;
		const name = (r.routeName ?? '').trim();
		if (!name) continue;
		const others = Math.max(0, Math.floor(r.othersAscents));
		if (!best || others > Math.max(0, Math.floor(best.othersAscents!))) best = r;
	}
	return best;
}

export function describeMostPopularPutUp(
	routes: readonly DeveloperImpactRoute[],
	format: (n: number) => string = String,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const best = mostPopularPutUp(routes);
	if (!best) return null;
	const name = best.routeName!.trim();
	const others = Math.max(0, Math.floor(best.othersAscents!));
	if (others >= PUT_UP_MEGA_ROUTE_OTHERS) {
		return formatMessage(locale, 'cards.climberBlurb.popularPutUpMega', {
			name,
			count: format(others)
		});
	}
	return formatMessage(locale, 'cards.climberBlurb.popularPutUp', { name });
}

function popularRouteLink(
	paragraphs: readonly string[],
	routes: readonly DeveloperImpactRoute[],
	format: (n: number) => string = String,
	locale: SupportedLocale = DEFAULT_LOCALE
): StoryRouteLink | null {
	const best = mostPopularPutUp(routes);
	if (!best) return null;
	const name = best.routeName!.trim();
	const others = Math.max(0, Math.floor(best.othersAscents!));
	const key =
		others >= PUT_UP_MEGA_ROUTE_OTHERS
			? 'cards.climberBlurb.popularPutUpMega'
			: 'cards.climberBlurb.popularPutUp';
	const partial = formatMessage(locale, key, { count: format(others) });
	const nameOffset = partial.indexOf('{name}');
	if (nameOffset < 0) return null;
	const sentence = partial.replace('{name}', name);
	const paragraph = paragraphs.findIndex((text) => text.includes(sentence));
	if (paragraph < 0) return null;
	let href: string | null = null;
	try {
		const url = new URL(best.url ?? '');
		if (
			['https://www.thecrag.com', 'https://thecrag.com'].includes(url.origin) &&
			!url.username &&
			!url.password &&
			/\/route\/\d+\/?$/.test(url.pathname)
		)
			href = url.href;
	} catch {
		/* A missing cache URL can use the canonical provider ID below. */
	}
	if (!href && /^\d+$/.test(best.routeExternalId)) href = theCragRouteUrl(best.routeExternalId);
	if (!href) return null;
	const start = paragraphs[paragraph].indexOf(sentence) + nameOffset;
	return { paragraph, start, end: start + name.length, href };
}

export function describeDeveloperPreference(input: {
	routes: readonly DeveloperImpactRoute[];
	firstAscentCount?: number;
	format?: (n: number) => string;
	locale?: SupportedLocale;
}): string | null {
	const fmt = input.format ?? ((n: number) => String(n));
	const locale = input.locale ?? DEFAULT_LOCALE;
	const byStyle = new Map<PutUpStyle, { routes: number; others: number }>();
	for (const style of PUT_UP_STYLE_PRIORITY) byStyle.set(style, { routes: 0, others: 0 });

	for (const r of input.routes) {
		const style = classifyPutUpStyle(r.gearStyle, r.bolts, r.sportOrBolted);
		if (!style) continue;
		const acc = byStyle.get(style)!;
		acc.routes += 1;
		if (r.othersAscents != null && Number.isFinite(r.othersAscents)) {
			acc.others += Math.max(0, Math.floor(r.othersAscents));
		}
	}

	let chosen: PutUpStyle | null = null;
	for (const style of PUT_UP_STYLE_PRIORITY) {
		const acc = byStyle.get(style)!;
		if (
			acc.routes >= DEVELOPER_ROUTES_MIN ||
			(acc.routes >= 1 && acc.others >= DEVELOPER_IMPACT_MIN)
		) {
			chosen = style;
			break;
		}
	}

	const fa = input.firstAscentCount ?? 0;
	const faSentence =
		fa >= 1
			? formatMessage(locale, 'cards.climberBlurb.devFirstAscents', {
					count: fa,
					formatted: fmt(fa)
				})
			: null;

	if (!chosen) return faSentence;

	const others = byStyle.get(chosen)!.others;
	const lead =
		chosen === 'Sport'
			? formatMessage(locale, 'cards.climberBlurb.devLeadSport')
			: chosen === 'Trad'
				? formatMessage(locale, 'cards.climberBlurb.devLeadTrad')
				: formatMessage(locale, 'cards.climberBlurb.devLeadBoulder');

	const character = putUpCharacter(input.routes);
	let styleSentence: string;
	if (character === 'obscure') {
		styleSentence = formatMessage(locale, 'cards.climberBlurb.devStyleObscure', { lead });
	} else if (character === 'classic') {
		styleSentence = formatMessage(locale, 'cards.climberBlurb.devStyleClassic', { lead });
	} else if (others >= DEVELOPER_IMPACT_MIN) {
		// Counts are cached route ascents (estimates), not distinct people.
		styleSentence = formatMessage(locale, 'cards.climberBlurb.devStyleImpact', {
			lead,
			count: fmt(others)
		});
	} else {
		styleSentence = formatMessage(locale, 'cards.climberBlurb.devStylePlain', { lead });
	}

	const parts = [styleSentence];
	if (faSentence) parts.push(faSentence);
	const popular = describeMostPopularPutUp(input.routes, fmt, locale);
	if (popular) parts.push(popular);
	return parts.join(' ');
}

export function describeHomeCrag(
	input: {
		topCrags: { crag: string; count: number }[];
		totalAscents: number;
	},
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (input.totalAscents < 10 || !input.topCrags.length) return null;
	const top = input.topCrags[0];
	if (!top?.crag) return null;
	const share = top.count / input.totalAscents;
	if (share >= HOME_CRAG_SHARE)
		return formatMessage(locale, 'cards.climberBlurb.homeCrag', { crag: top.crag });
	return null;
}

export function describeWanderer(
	distinctCrags: number,
	topShare: number | null,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (distinctCrags < 5) return null;
	if (topShare != null && topShare >= WANDER_MAX_SHARE) return null;
	return formatMessage(locale, 'cards.climberBlurb.wanderer', { count: distinctCrags });
}

export function describePartners(
	partners: { name: string; count: number }[],
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const top = partners[0];
	if (!top?.name || top.count < PARTNER_MIN) return null;
	return formatMessage(locale, 'cards.climberBlurb.partner', { name: top.name });
}

function southernHemisphere(locale: string | undefined): boolean {
	const loc = (locale || '').toLowerCase();
	// Default display locale is en-AU; treat common southern locales as southern seasons.
	return /(-(au|nz|za|ar|cl|br|uy|pe|bo)|^(af|es)-(ar|cl|za)|en-au|en-nz)/.test(loc);
}

/** Month index 0–11 → season name for the locale's hemisphere. */
export function seasonNameForMonth(monthIndex: number, locale?: string): string {
	const m = ((monthIndex % 12) + 12) % 12;
	const southern = southernHemisphere(locale);
	// Southern: spring SON, summer DJF, autumn MAM, winter JJA.
	// Northern: spring MAM, summer JJA, autumn SON, winter DJF.
	if (southern) {
		if (m === 11 || m <= 1) return 'summer';
		if (m >= 2 && m <= 4) return 'autumn';
		if (m >= 5 && m <= 7) return 'winter';
		return 'spring';
	}
	if (m >= 2 && m <= 4) return 'spring';
	if (m >= 5 && m <= 7) return 'summer';
	if (m >= 8 && m <= 10) return 'autumn';
	return 'winter';
}

const SEASON_KEYS: Record<string, string> = {
	spring: 'cards.climberBlurb.seasonSpring',
	summer: 'cards.climberBlurb.seasonSummer',
	autumn: 'cards.climberBlurb.seasonAutumn',
	winter: 'cards.climberBlurb.seasonWinter'
};

export function describeSeason(
	activeDayDates: string[],
	locale?: string,
	uiLocale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (activeDayDates.length < 20) return null;
	const seasonDays = new Map<string, number>();
	const monthDays = new Array(12).fill(0);
	for (const day of activeDayDates) {
		if (!day || day.length < 7) continue;
		const month = Number(day.slice(5, 7));
		if (!Number.isFinite(month) || month < 1 || month > 12) continue;
		const idx = month - 1;
		monthDays[idx] += 1;
		const season = seasonNameForMonth(idx, locale);
		seasonDays.set(season, (seasonDays.get(season) ?? 0) + 1);
	}
	const total = [...seasonDays.values()].reduce((a, b) => a + b, 0);
	if (total < 20) return null;
	const ranked = [...seasonDays.entries()].sort((a, b) => b[1] - a[1]);
	const [season, count] = ranked[0] ?? [];
	if (!season || count / total < SEASON_SHARE) return null;
	const months = monthLabels((key) => formatMessage(uiLocale, key));
	const topMonths = monthDays
		.map((n, i) => ({ n, i }))
		.sort((a, b) => b.n - a.n)
		.slice(0, 2)
		.filter((m) => m.n > 0)
		.map((m) => months[m.i]);
	const seasonLabel = SEASON_KEYS[season] ? formatMessage(uiLocale, SEASON_KEYS[season]) : season;
	if (topMonths.length >= 2) {
		return formatMessage(uiLocale, 'cards.climberBlurb.seasonWithMonths', {
			season: seasonLabel,
			month1: topMonths[0]!,
			month2: topMonths[1]!
		});
	}
	return formatMessage(uiLocale, 'cards.climberBlurb.seasonPlain', { season: seasonLabel });
}

export function describeSolo(
	soloByKind: { kind: string; count: number }[],
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const prefer = ['free', 'lead', 'dws'] as const;
	const keys: Record<(typeof prefer)[number], string> = {
		free: 'cards.climberBlurb.soloFree',
		lead: 'cards.climberBlurb.soloLead',
		dws: 'cards.climberBlurb.soloDws'
	};
	let best: { kind: (typeof prefer)[number]; count: number } | null = null;
	for (const kind of prefer) {
		const row = soloByKind.find((s) => s.kind === kind);
		if (!row || row.count < SOLO_MIN) continue;
		if (!best || row.count > best.count) best = { kind, count: row.count };
	}
	if (!best) return null;
	return formatMessage(locale, keys[best.kind], { count: best.count });
}

export function describeProjects(
	openProjects: number,
	format?: (n: number) => string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (openProjects < PROJECTS_MIN) return null;
	const fmt = format ?? String;
	return formatMessage(locale, 'cards.climberBlurb.openProjects', { count: fmt(openProjects) });
}

export function describeHardest(
	routeLabel: string | null | undefined,
	boulderLabel: string | null | undefined,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	const route = (routeLabel || '').trim();
	const boulder = (boulderLabel || '').trim();
	if (route && boulder)
		return formatMessage(locale, 'cards.climberBlurb.hardestBoth', { route, boulder });
	if (route) return formatMessage(locale, 'cards.climberBlurb.hardestRoute', { route });
	if (boulder) return formatMessage(locale, 'cards.climberBlurb.hardestBoulder', { boulder });
	return null;
}

export function describePopularity(
	pop: {
		busyPct: number;
		quietPct: number;
		withData: number;
	},
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (pop.withData < POP_MIN_WITH_DATA) return null;
	const quietShare = pop.quietPct / 100;
	const busyShare = pop.busyPct / 100;
	if (quietShare >= POP_SHARE) return formatMessage(locale, 'cards.climberBlurb.popularityQuiet');
	if (busyShare >= POP_SHARE) return formatMessage(locale, 'cards.climberBlurb.popularityBusy');
	return null;
}

/**
 * One gated weather personality line from the cached outdoor days (#275). Null unless there are
 * at least 20 days with weather covering at least half of the outdoor days,
 * so a thin cache never invents a personality. Wording stays positive: it describes what
 * you climb in, never what you avoid.
 */
export function describeWeatherPersonality(
	weather: WeatherConditionsView | null | undefined,
	format?: (n: number) => string,
	displayUnits?: DisplayUnits,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (!weather) return null;
	const { withWeather, outdoorDays } = weather;
	if (withWeather < WEATHER_STORY_MIN_DAYS || outdoorDays <= 0) return null;
	if (withWeather / outdoorDays < WEATHER_STORY_MIN_COVERAGE) return null;
	const fmt = format ?? String;
	const share = (key: string) => weather.shares.find((s) => s.key === key);
	const pct = (n: number) => fmt(Math.round(n));

	const snow = share('snow');
	if (snow && snow.days >= WEATHER_SNOW_MIN_DAYS) {
		return formatMessage(locale, 'cards.climberBlurb.weatherSnow', { days: fmt(snow.days) });
	}
	const freeze = share('freeze');
	if (freeze && freeze.pct >= WEATHER_COLD_SHARE) {
		return formatMessage(locale, 'cards.climberBlurb.weatherCold', { percent: pct(freeze.pct) });
	}
	const heat = share('heat');
	if (heat && heat.pct >= WEATHER_HEAT_SHARE) {
		const label = displayUnits?.temperature === 'fahrenheit' ? '95°F' : '35°C';
		return formatMessage(locale, 'cards.climberBlurb.weatherHeat', {
			percent: pct(heat.pct),
			temp: label
		});
	}
	const rain = share('rain');
	if (rain && rain.pct >= WEATHER_RAIN_SHARE) {
		return formatMessage(locale, 'cards.climberBlurb.weatherRain', { percent: pct(rain.pct) });
	}
	const hot = weather.hottest?.tempC;
	const cold = weather.coldest?.tempC;
	if (hot != null && cold != null && hot - cold >= WEATHER_RANGE_MIN_C) {
		const coldLabel = formatTemperature(cold, displayUnits?.temperature ?? 'celsius');
		const hotLabel = formatTemperature(hot, displayUnits?.temperature ?? 'celsius');
		return formatMessage(locale, 'cards.climberBlurb.weatherRange', {
			cold: coldLabel,
			hot: hotLabel
		});
	}
	return null;
}

export function describeTravel(
	countries: number,
	format?: (n: number) => string,
	locale: SupportedLocale = DEFAULT_LOCALE
): string | null {
	if (countries < 2) return null;
	const fmt = format ?? String;
	return formatMessage(locale, 'cards.climberBlurb.travelCountries', { count: fmt(countries) });
}

function formatDurationHuman(
	isoDate: string,
	now = new Date(),
	locale: SupportedLocale = DEFAULT_LOCALE
): string {
	const start = new Date(isoDate.length === 10 ? `${isoDate}T12:00:00` : isoDate);
	if (Number.isNaN(start.getTime()))
		return formatMessage(locale, 'cards.climberBlurb.durationSomeTime');
	const months =
		(now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
	const years = Math.floor(Math.max(0, months) / 12);
	const rem = Math.max(0, months) % 12;
	if (years <= 0)
		return formatMessage(locale, 'cards.climberBlurb.durationMonths', { count: Math.max(1, rem) });
	if (rem === 0) return formatMessage(locale, 'cards.climberBlurb.durationYears', { count: years });
	return formatMessage(locale, 'cards.climberBlurb.durationYearsAndMonths', {
		years: formatMessage(locale, 'cards.climberBlurb.durationYears', { count: years }),
		months: formatMessage(locale, 'cards.climberBlurb.durationMonths', { count: rem })
	});
}

export function buildClimberBlurb(input: ClimberBlurbInput): ClimberBlurb {
	const locale = input.locale ?? DEFAULT_LOCALE;
	const fmt = (n: number) => (input.dateDisplay ? formatNumber(n, input.dateDisplay) : String(n));
	const heightM = Math.round(input.heightM);
	const heightKm = Math.round((heightM / 1000) * 10) / 10;
	const everest = heightM > 0 ? Math.round((heightM / 8849) * 10) / 10 : 0;
	const elCap = heightM > 0 ? Math.round((heightM / 900) * 10) / 10 : 0;
	const worldLaps = heightKm > 0 ? Math.round((heightKm / 40075) * 100) / 100 : 0;
	const perDay =
		input.activeDays > 0 ? Math.round((input.totalAscents / input.activeDays) * 10) / 10 : 0;
	const identity = climberTypeSentence(
		input.climberType,
		describeSendPreference(
			{
				onsightCount: input.onsightCount,
				flashCount: input.flashCount,
				redpointCount: input.redpointCount,
				pinkpointCount: input.pinkpointCount,
				totalSends: input.totalSends
			},
			locale
		),
		locale
	);

	const optional: string[] = [];
	const push = (s: string | null | undefined) => {
		if (s && optional.length < MAX_OPTIONAL) optional.push(s);
	};

	push(
		describeDeveloperPreference({
			routes: input.putUpRoutes ?? [],
			firstAscentCount: input.firstAscentCount ?? 0,
			format: fmt,
			locale
		})
	);

	const top = input.topCrags?.[0];
	const topShare = top && input.totalAscents > 0 ? top.count / input.totalAscents : null;
	const home = describeHomeCrag(
		{
			topCrags: input.topCrags ?? [],
			totalAscents: input.totalAscents
		},
		locale
	);
	push(home);
	if (!home) push(describeWanderer(input.distinctCrags, topShare, locale));

	push(describePartners(input.partners ?? [], locale));
	push(
		describeSeason(
			input.activeDayDates ?? [],
			(input.dateDisplay ?? DEFAULT_DATE_DISPLAY).locale,
			locale
		)
	);
	push(describeWeatherPersonality(input.weather, fmt, input.displayUnits, locale));
	push(describeSolo(input.soloByKind ?? [], locale));
	push(describeProjects(input.openProjects ?? 0, fmt, locale));
	push(describeHardest(input.hardestRouteLabel, input.hardestBoulderLabel, locale));
	if (input.popularity) push(describePopularity(input.popularity, locale));
	push(describeTravel(input.countries ?? 0, fmt, locale));
	if (input.rockBlurb) push(input.rockBlurb);

	if (!input.firstDate) {
		const paragraphs = [
			formatMessage(locale, 'cards.climberBlurb.leadNoFirstDate', {
				ascents: fmt(input.totalAscents),
				crags: fmt(input.distinctCrags)
			}),
			identity,
			...optional
		];
		return {
			startedOn: null,
			durationLabel: null,
			paragraphs,
			routeLink: popularRouteLink(paragraphs, input.putUpRoutes ?? [], fmt, locale)
		};
	}

	const duration = formatDurationHuman(input.firstDate, new Date(), locale);
	const outdoorBit =
		input.outdoorAscents != null
			? input.indoorAscents != null
				? ` ${formatMessage(locale, 'cards.climberBlurb.outdoorIndoorSplit', {
						outdoor: fmt(input.outdoorAscents),
						indoor: fmt(input.indoorAscents)
					})}`
				: ` ${formatMessage(locale, 'cards.climberBlurb.outdoorOnlySplit', {
						outdoor: fmt(input.outdoorAscents)
					})}`
			: '';

	const distanceLabel = formatDistance(heightKm, input.displayUnits?.distance ?? 'km');
	const paragraphs = [
		formatMessage(locale, 'cards.climberBlurb.coreSinceBegan', {
			duration,
			date: input.firstDate,
			days: fmt(input.activeDays)
		}),
		formatMessage(locale, 'cards.climberBlurb.coreRackedUp', {
			ascents: fmt(input.totalAscents),
			sends: fmt(input.totalSends),
			onsights: fmt(input.onsightCount),
			outdoor: outdoorBit,
			routes: fmt(input.distinctRoutes),
			crags: fmt(input.distinctCrags)
		}),
		heightM > 0
			? worldLaps > 0
				? formatMessage(locale, 'cards.climberBlurb.coreHeightWithWorldLaps', {
						distance: distanceLabel,
						everest,
						elCap,
						worldLaps
					})
				: formatMessage(locale, 'cards.climberBlurb.coreHeight', {
						distance: distanceLabel,
						everest,
						elCap
					})
			: null,
		formatMessage(locale, 'cards.climberBlurb.corePerDay', { perDay }),
		identity,
		...optional
	].filter((p): p is string => Boolean(p));

	return {
		startedOn: input.firstDate,
		durationLabel: duration,
		paragraphs,
		routeLink: popularRouteLink(paragraphs, input.putUpRoutes ?? [], fmt, locale)
	};
}
