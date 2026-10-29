/**
 * Climbing story copy (#186). Core tenure/volume/identity paragraphs, then up to a few
 * optional personality lines when the signal is strong — never a second dashboard dump.
 */
import { MONTH_LABELS } from '#lib/bestMonths';
import { DEFAULT_DATE_DISPLAY, formatNumber, type DateDisplay } from '#lib/dates';
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
const MAX_OPTIONAL = 3;

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
	dateDisplay?: DateDisplay;
};

export type ClimberBlurb = {
	startedOn: string | null;
	durationLabel: string | null;
	paragraphs: string[];
};

/** First-go vs worked-route preference from tick mix. */
export function describeSendPreference(input: {
	onsightCount: number;
	flashCount: number;
	redpointCount: number;
	pinkpointCount: number;
	totalSends: number;
}): string {
	const firstGo = input.onsightCount + input.flashCount;
	const worked = input.redpointCount + input.pinkpointCount;
	const classified = firstGo + worked;
	if (classified === 0) return 'I mix onsighting with redpointing and working routes';
	const firstGoShare = firstGo / classified;
	const workedShare = worked / classified;
	if (firstGoShare >= MAJORITY) return 'I like to onsight (and flash) when I can';
	if (workedShare >= MAJORITY) return 'I tend to work routes and redpoint them';
	return 'I mix onsighting with redpointing and working routes';
}

export function climberTypeSentence(climberType: string, preference: string): string {
	const type = (climberType || 'Rock climber').trim() || 'Rock climber';
	const labeled = /climber$/i.test(type) ? type : `${type} climber`;
	return `I'm a ${labeled} — ${preference}.`;
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

export function describeDeveloperPreference(input: {
	routes: readonly DeveloperImpactRoute[];
	firstAscentCount?: number;
	format?: (n: number) => string;
}): string | null {
	const fmt = input.format ?? ((n: number) => String(n));
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
	const faSentence = fa >= 1 ? `I've put up ${fmt(fa)} first ascent${fa === 1 ? '' : 's'}.` : null;

	if (!chosen) return faSentence;

	const others = byStyle.get(chosen)!.others;
	const lead =
		chosen === 'Sport'
			? 'I like to bolt sport routes'
			: chosen === 'Trad'
				? 'I like to put up trad routes'
				: 'I like to put up boulders';

	// Counts are cached route ascents (estimates), not distinct people.
	let impact = '';
	if (others >= DEVELOPER_IMPACT_MIN) {
		impact = ` that other people have climbed over ${fmt(others)} times`;
	}

	const styleSentence = `${lead}${impact}.`;
	return faSentence ? `${styleSentence} ${faSentence}` : styleSentence;
}

export function describeHomeCrag(input: {
	topCrags: { crag: string; count: number }[];
	totalAscents: number;
}): string | null {
	if (input.totalAscents < 10 || !input.topCrags.length) return null;
	const top = input.topCrags[0];
	if (!top?.crag) return null;
	const share = top.count / input.totalAscents;
	if (share >= HOME_CRAG_SHARE) return `I often climb at ${top.crag}.`;
	return null;
}

export function describeWanderer(distinctCrags: number, topShare: number | null): string | null {
	if (distinctCrags < 5) return null;
	if (topShare != null && topShare >= WANDER_MAX_SHARE) return null;
	return `I hop around — ${distinctCrags} areas and no single home crag.`;
}

export function describePartners(partners: { name: string; count: number }[]): string | null {
	const top = partners[0];
	if (!top?.name || top.count < PARTNER_MIN) return null;
	return `I climb a lot with ${top.name}.`;
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

export function describeSeason(activeDayDates: string[], locale?: string): string | null {
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
	const topMonths = monthDays
		.map((n, i) => ({ n, i }))
		.sort((a, b) => b.n - a.n)
		.slice(0, 2)
		.filter((m) => m.n > 0)
		.map((m) => MONTH_LABELS[m.i]);
	const monthsBit =
		topMonths.length >= 2 ? ` — ${topMonths[0]} and ${topMonths[1]} are my busy months` : '';
	return `I'm a ${season} climber${monthsBit}.`;
}

export function describeSolo(soloByKind: { kind: string; count: number }[]): string | null {
	const prefer = ['free', 'lead', 'dws'] as const;
	const labels: Record<(typeof prefer)[number], string> = {
		free: 'free solos',
		lead: 'lead solos',
		dws: 'deep water solos'
	};
	let best: { kind: (typeof prefer)[number]; count: number } | null = null;
	for (const kind of prefer) {
		const row = soloByKind.find((s) => s.kind === kind);
		if (!row || row.count < SOLO_MIN) continue;
		if (!best || row.count > best.count) best = { kind, count: row.count };
	}
	if (!best) return null;
	return `I've logged ${best.count} ${labels[best.kind]}.`;
}

export function describeProjects(
	openProjects: number,
	format?: (n: number) => string
): string | null {
	if (openProjects < PROJECTS_MIN) return null;
	const fmt = format ?? String;
	return `I'm sitting on ${fmt(openProjects)} open projects.`;
}

export function describeHardest(
	routeLabel: string | null | undefined,
	boulderLabel: string | null | undefined
): string | null {
	const route = (routeLabel || '').trim();
	const boulder = (boulderLabel || '').trim();
	if (route && boulder) return `Hardest sends sit around ${route} / ${boulder}.`;
	if (route) return `Hardest sends sit around ${route}.`;
	if (boulder) return `Hardest boulder sends sit around ${boulder}.`;
	return null;
}

export function describePopularity(pop: {
	busyPct: number;
	quietPct: number;
	withData: number;
}): string | null {
	if (pop.withData < POP_MIN_WITH_DATA) return null;
	const quietShare = pop.quietPct / 100;
	const busyShare = pop.busyPct / 100;
	if (quietShare >= POP_SHARE) return 'I like quiet gems as much as the classics.';
	if (busyShare >= POP_SHARE) return 'I climb a lot of the busy classics.';
	return null;
}

export function describeTravel(countries: number, format?: (n: number) => string): string | null {
	if (countries < 2) return null;
	const fmt = format ?? String;
	return `Climbed in ${fmt(countries)} countries.`;
}

function formatDurationHuman(isoDate: string, now = new Date()): string {
	const start = new Date(isoDate.length === 10 ? `${isoDate}T12:00:00` : isoDate);
	if (Number.isNaN(start.getTime())) return 'some time';
	const months =
		(now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
	const years = Math.floor(Math.max(0, months) / 12);
	const rem = Math.max(0, months) % 12;
	if (years <= 0) return rem <= 1 ? `${Math.max(1, rem)} month` : `${rem} months`;
	if (rem === 0) return years === 1 ? '1 year' : `${years} years`;
	return `${years} year${years === 1 ? '' : 's'} and ${rem} month${rem === 1 ? '' : 's'}`;
}

export function buildClimberBlurb(input: ClimberBlurbInput): ClimberBlurb {
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
		describeSendPreference({
			onsightCount: input.onsightCount,
			flashCount: input.flashCount,
			redpointCount: input.redpointCount,
			pinkpointCount: input.pinkpointCount,
			totalSends: input.totalSends
		})
	);

	const optional: string[] = [];
	const push = (s: string | null | undefined) => {
		if (s && optional.length < MAX_OPTIONAL) optional.push(s);
	};

	push(
		describeDeveloperPreference({
			routes: input.putUpRoutes ?? [],
			firstAscentCount: input.firstAscentCount ?? 0,
			format: fmt
		})
	);

	const top = input.topCrags?.[0];
	const topShare = top && input.totalAscents > 0 ? top.count / input.totalAscents : null;
	const home = describeHomeCrag({
		topCrags: input.topCrags ?? [],
		totalAscents: input.totalAscents
	});
	push(home);
	if (!home) push(describeWanderer(input.distinctCrags, topShare));

	push(describePartners(input.partners ?? []));
	push(
		describeSeason(input.activeDayDates ?? [], (input.dateDisplay ?? DEFAULT_DATE_DISPLAY).locale)
	);
	push(describeSolo(input.soloByKind ?? []));
	push(describeProjects(input.openProjects ?? 0, fmt));
	push(describeHardest(input.hardestRouteLabel, input.hardestBoulderLabel));
	if (input.popularity) push(describePopularity(input.popularity));
	push(describeTravel(input.countries ?? 0, fmt));
	if (input.rockBlurb) push(input.rockBlurb);

	if (!input.firstDate) {
		return {
			startedOn: null,
			durationLabel: null,
			paragraphs: [
				`You've logged ${fmt(input.totalAscents)} ascents across ${fmt(input.distinctCrags)} crags so far.`,
				identity,
				...optional
			]
		};
	}

	const duration = formatDurationHuman(input.firstDate);
	const outdoorBit =
		input.outdoorAscents != null
			? ` ${fmt(input.outdoorAscents)} outdoor` +
				(input.indoorAscents != null ? ` / ${fmt(input.indoorAscents)} indoor` : '')
			: '';

	const paragraphs = [
		`Since I began climbing ${duration} ago on ${input.firstDate}, I've logged ${fmt(input.activeDays)} active days at the crag.`,
		`In that time I've racked up ${fmt(input.totalAscents)} logged ascents (${fmt(input.totalSends)} sends, ${fmt(input.onsightCount)} onsights)${outdoorBit}, on ${fmt(input.distinctRoutes)} routes across ${fmt(input.distinctCrags)} areas.`,
		heightM > 0
			? `That's about ${heightKm} km of rock — roughly ${everest}× Everest or ${elCap}× El Capitan${worldLaps > 0 ? `, and ${worldLaps} trips around the world if you laid the rope end-to-end` : ''}.`
			: null,
		`On average that's ${perDay} ascents per active day.`,
		identity,
		...optional
	].filter((p): p is string => Boolean(p));

	return { startedOn: input.firstDate, durationLabel: duration, paragraphs };
}
