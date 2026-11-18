import { formatMessage, type MessageKey } from '#lib/i18n/format';
import type { SupportedLocale } from '#lib/i18n/types';

/**
 * In-app docs (/docs). Page bodies are Markdown in docs/guide/<slug>.md; this manifest gives
 * order, titles and summaries. `<!-- component:name -->` markers in the Markdown are replaced
 * by generated tables (see DocBlock.svelte).
 */
export type DocPage = { slug: string; title: string; summary: string };

export type DocSegment = { kind: 'html'; html: string } | { kind: 'component'; name: string };
export type RenderedDoc = { slug: string; title: string; segments: DocSegment[] };

export const DOC_PAGES: readonly DocPage[] = [
	{
		slug: 'logbook-sync',
		title: 'Logbook sync',
		summary: 'For the server owner: scheduled API sync with a supporter key, or manual CSV uploads.'
	},
	{
		slug: 'offline',
		title: 'Offline mode',
		summary: 'Download a read-only public stats and logbook snapshot for this browser.'
	},
	{
		slug: 'badges',
		title: 'Badges',
		summary: 'Logbook milestones and the automatic First Moves import date.'
	},
	{
		slug: 'display-settings',
		title: 'Display settings',
		summary: 'Date formats, granular units, and the metric thresholds that stay fixed.'
	},
	{
		slug: 'weather',
		title: 'Weather',
		summary:
			'Optional Open-Meteo outdoor day cache and heat / freeze / rain / snow / wind badges (opt-in WEATHER_IMPORT).'
	},
	{
		slug: 'climbing-map',
		title: 'Climbing map',
		summary: 'Worldwide places, glowing ascent-density markers, filters and location coverage.'
	},
	{
		slug: 'climber-type',
		title: 'Climber type',
		summary: 'How the dashboard decides whether you are a sport, trad, boulder or rock climber.'
	},
	{
		slug: 'climbing-story',
		title: 'Climbing story',
		summary:
			'First-person blurb from your logbook: tenure, put-up routes, home crag, partners and other strong signals.'
	},
	{
		slug: 'climber-profile',
		title: 'Climber profile',
		summary:
			'Radar axes for volume, variety, density, height, intensity and consistency over 30 vs 90 days.'
	},
	{
		slug: 'grades',
		title: 'Grades & grade bands',
		summary: 'Beginner → Elite bands, how grade systems are compared, and conversion tables.'
	},
	{
		slug: 'tick-types',
		title: 'Tick types',
		summary: 'Onsight, flash, red point, attempts and the rest, and which count as sends.'
	},
	{
		slug: 'cpr',
		title: 'CPR',
		summary:
			"theCrag's Climber Performance Rating, how it's calculated and how to read the timeline."
	},
	{
		slug: 'training-load',
		title: 'Training load',
		summary: 'The intensity-weighted acute:chronic load model behind the Training load card.'
	},
	{
		slug: 'ascent-calendar',
		title: 'Ascent calendar',
		summary:
			'Year heatmap of logged days; Intensity scales by volume, Grade by hardest send band that day.'
	},
	{
		slug: 'activity',
		title: 'Activity',
		summary:
			'Monthly and yearly volume beyond the dashboard cards — full per-month tables and YoY deltas.'
	},
	{
		slug: 'sessions-per-week',
		title: 'Sessions per week',
		summary: 'Climbing days per ISO week and the yearly average session rate.'
	},
	{
		slug: 'weekday',
		title: 'Weekday',
		summary:
			'Which days of the week you climb — sessions and ascents Mon–Sun, all-time or last 12 weeks.'
	},
	{
		slug: 'best-months',
		title: 'Best months',
		summary:
			'theCrag seasonality for your top crags, weighted by your ticks, compared with when you climb there.'
	},
	{
		slug: 'eddington',
		title: 'Eddington numbers',
		summary:
			"Cycling's Eddington number adapted to climbing: send days, vertical days and grade indexes."
	},
	{
		slug: 'yearly-stats',
		title: 'Yearly stats',
		summary:
			'Per-year bars or cumulative career totals for ascents, sends and height, with optional within-year lines.'
	},
	{
		slug: 'first-ascents',
		title: 'First ascents',
		summary: 'Marking your FAs and FFAs, routes you set, and community ticks on lines you put up.'
	},
	{
		slug: 'goals',
		title: 'Goals',
		summary:
			'Yearly grade, height and day targets; grade bars use pyramid readiness instead of best÷target.'
	},
	{
		slug: 'projects',
		title: 'Projects',
		summary:
			'Auto-detected projects, public guidebook excerpts on cards, and how that differs from private notes.'
	},
	{
		slug: 'solo',
		title: 'Solo climbing',
		summary: 'Top-rope, lead, free and deep water soloing, and ascents with no partner tagged.'
	},
	{
		slug: 'rock-types',
		title: 'Rock types',
		summary: 'Rock type tags from theCrag, the volume card, and send rate / near-limit by rock.'
	},
	{
		slug: 'partners',
		title: 'Partners',
		summary: 'Who you climb with — rank by shared ascents, sessions (days), or distinct crags.'
	},
	{
		slug: 'route-popularity',
		title: 'Route popularity',
		summary:
			'Busy vs quiet ticks from theCrag popularity, plus hidden gems (high quality, low traffic).'
	},
	{
		slug: 'repeats',
		title: 'Repeats vs new routes',
		summary:
			'First visits versus return days on the same route, with Explorer and Repeat climber labels.'
	},
	{
		slug: 'karma',
		title: 'Karma',
		summary: 'Approximate ascent karma from routes logged; guide-edit points wait on a theCrag API.'
	}
];

const DOC_KEYS: Record<string, string> = {
	'logbook-sync': 'logbookSync',
	offline: 'offline',
	badges: 'badges',
	'display-settings': 'displaySettings',
	weather: 'weather',
	'climbing-map': 'climbingMap',
	'climber-type': 'climberType',
	'climbing-story': 'climbingStory',
	'climber-profile': 'climberProfile',
	grades: 'grades',
	'tick-types': 'tickTypes',
	cpr: 'cpr',
	'training-load': 'trainingLoad',
	'ascent-calendar': 'ascentCalendar',
	activity: 'activity',
	'sessions-per-week': 'sessionsPerWeek',
	weekday: 'weekday',
	'best-months': 'bestMonths',
	eddington: 'eddington',
	'yearly-stats': 'yearlyStats',
	'first-ascents': 'firstAscents',
	goals: 'goals',
	projects: 'projects',
	solo: 'solo',
	'rock-types': 'rockTypes',
	partners: 'partners',
	'route-popularity': 'routePopularity',
	repeats: 'repeats',
	karma: 'karma'
};

export function docPage(slug: string, locale?: SupportedLocale | null): DocPage | undefined {
	const page = DOC_PAGES.find((d) => d.slug === slug);
	if (!page) return undefined;
	if (!locale || locale === 'en') return page;
	const key = DOC_KEYS[slug];
	if (!key) return page;
	const titleKey = `pages.docsPages.${key}.title` as MessageKey;
	const summaryKey = `pages.docsPages.${key}.summary` as MessageKey;
	const title = formatMessage(locale, titleKey);
	const summary = formatMessage(locale, summaryKey);
	return {
		slug,
		title: title && title !== titleKey ? title : page.title,
		summary: summary && summary !== summaryKey ? summary : page.summary
	};
}

export function docPages(locale?: SupportedLocale | null): DocPage[] {
	return DOC_PAGES.map((p) => docPage(p.slug, locale)!);
}

/** Band descriptions, paraphrased from theCrag's grades article. */
export const BAND_DOCS: Record<number, { routes: string; boulders: string; text: string }> = {
	1: {
		routes: '1–12',
		boulders: 'VB-–VB+',
		text: 'Your first days of climbing, often seconding or top-roping. Many people manage these on day one, though a few climbs at this level are still serious.'
	},
	2: {
		routes: '13–18',
		boulders: 'V0-–V0+',
		text: 'Typical for climbers in their first year. Most outdoor climbing happens in this band, and plenty of experienced climbers come back to it for fun.'
	},
	3: {
		routes: '19–24',
		boulders: 'V1–V4',
		text: 'Within reach after a couple of years of regular climbing; casual climbers become rare here.'
	},
	4: {
		routes: '25–32',
		boulders: 'V5–V10',
		text: 'Needs focused, structured training; relatively few climbers get here.'
	},
	5: {
		routes: '33+',
		boulders: 'V11+',
		text: 'Professional level: the best climbers in the world.'
	}
};

export function getBandDocText(bandId: number, locale?: SupportedLocale | null): string {
	if (locale && locale !== 'en') {
		const key = `cards.docBlock.bandText${bandId}` as MessageKey;
		const text = formatMessage(locale, key);
		if (text && text !== key) return text;
	}
	return BAND_DOCS[bandId]?.text ?? '';
}

export type TickDoc = { name: string; meaning: string; send: boolean };
export type TickGroup = { group: string; styles: string; ticks: TickDoc[] };

/**
 * theCrag tick types grouped as on theCrag, paraphrased. `send` must match classifyTick()
 * (unit-tested in docs.test.ts).
 */
export const TICK_DOCS: readonly TickGroup[] = [
	{
		group: 'Lead',
		styles: 'Sport, trad, deep-water solo, ice',
		ticks: [
			{
				name: 'Onsight',
				meaning: 'Led clean on the first try with no prior beta or inspection.',
				send: true
			},
			{
				name: 'Flash',
				meaning: 'Led clean on the first try, but with beta or inspection.',
				send: true
			},
			{
				name: 'Red point',
				meaning: 'Led clean after earlier attempts (includes repeats).',
				send: true
			},
			{
				name: 'Pink point',
				meaning: 'Red point with the gear or draws already in place.',
				send: true
			},
			{
				name: 'Green point',
				meaning: 'A bolted route led on trad gear only; counts as trad.',
				send: true
			},
			{
				name: 'Ground up red point',
				meaning: 'Red point where every failed try was lowered off and pulled, with no working.',
				send: true
			},
			{
				name: 'All free with rest',
				meaning: 'Climbed free but rested or fell; only accepted in some regions (e.g. Saxony).',
				send: true
			},
			{ name: 'Lead solo', meaning: 'Led alone using a self-belay device.', send: true },
			{ name: 'Hang dog', meaning: 'Led to the top but fell or rested on gear.', send: false }
		]
	},
	{
		group: 'Bouldering',
		styles: 'Boulder',
		ticks: [
			{
				name: 'Onsight',
				meaning: 'Topped first try with no beta (rare in bouldering).',
				send: true
			},
			{ name: 'Flash', meaning: 'Topped first try, with beta.', send: true },
			{ name: 'Send', meaning: 'Topped cleanly after earlier attempts.', send: true },
			{ name: 'Repeat', meaning: 'Topped a problem you had already done.', send: true },
			{
				name: 'Dab',
				meaning: 'Topped, but touched the ground or a spotter on the way.',
				send: false
			}
		]
	},
	{
		group: 'Top rope & seconding',
		styles: 'Top rope, second',
		ticks: [
			{ name: 'Onsight', meaning: 'Clean on the first try with no beta.', send: true },
			{ name: 'Flash', meaning: 'Clean on the first try, with beta.', send: true },
			{ name: 'Clean', meaning: 'Clean after earlier attempts (includes repeats).', send: true },
			{
				name: 'Roped solo',
				meaning: 'Top-roped alone on a self-belay rope fixed from above.',
				send: true
			},
			{ name: 'Hang dog', meaning: 'Reached the top but fell or rested on the rope.', send: false }
		]
	},
	{
		group: 'Aid & free solo',
		styles: 'Aid, free solo',
		ticks: [
			{ name: 'Tick', meaning: 'Aided the route using fixed or placed protection.', send: true },
			{ name: 'Aid solo', meaning: 'Aided the route alone.', send: true },
			{
				name: 'Free solo',
				meaning: 'Climbed without a rope (onsight, flash or red point).',
				send: true
			}
		]
	},
	{
		group: 'Attempts',
		styles: 'All styles',
		ticks: [
			{ name: 'Working', meaning: 'Projecting the route or problem.', send: false },
			{ name: 'Attempt', meaning: 'Tried but did not complete it.', send: false },
			{ name: 'Retreat', meaning: 'Backed off (too hard, weather, gear, injury…).', send: false }
		]
	},
	{
		group: 'General',
		styles: 'Most styles',
		ticks: [
			{
				name: 'Tick',
				meaning: 'Climbed it; used for alpine, via ferrata, or when you forget how.',
				send: true
			}
		]
	}
];

type TickDocMeta = {
	nameKey?: MessageKey;
	meaningKey: MessageKey;
};

type TickGroupMeta = {
	groupKey: MessageKey;
	stylesKey: MessageKey;
	ticks: TickDocMeta[];
};

const TICK_DOCS_META: TickGroupMeta[] = [
	{
		groupKey: 'cards.docBlock.tickGroupLead',
		stylesKey: 'cards.docBlock.tickGroupLeadStyles',
		ticks: [
			{ nameKey: 'ticks.onsight', meaningKey: 'cards.docBlock.tickMeaningLeadOnsight' },
			{ nameKey: 'ticks.flash', meaningKey: 'cards.docBlock.tickMeaningLeadFlash' },
			{ nameKey: 'ticks.redpoint', meaningKey: 'cards.docBlock.tickMeaningLeadRedPoint' },
			{ nameKey: 'ticks.pinkpoint', meaningKey: 'cards.docBlock.tickMeaningLeadPinkPoint' },
			{
				nameKey: 'cards.docBlock.tickNameGreenPoint',
				meaningKey: 'cards.docBlock.tickMeaningLeadGreenPoint'
			},
			{
				nameKey: 'cards.docBlock.tickNameGroundUpRedPoint',
				meaningKey: 'cards.docBlock.tickMeaningLeadGroundUpRedPoint'
			},
			{
				nameKey: 'ticks.allfreewithrest',
				meaningKey: 'cards.docBlock.tickMeaningLeadAllFreeWithRest'
			},
			{ nameKey: 'ticks.leadsolo', meaningKey: 'cards.docBlock.tickMeaningLeadSolo' },
			{ nameKey: 'ticks.hangdog', meaningKey: 'cards.docBlock.tickMeaningLeadHangDog' }
		]
	},
	{
		groupKey: 'cards.docBlock.tickGroupBouldering',
		stylesKey: 'cards.docBlock.tickGroupBoulderingStyles',
		ticks: [
			{ nameKey: 'ticks.onsight', meaningKey: 'cards.docBlock.tickMeaningBoulderOnsight' },
			{ nameKey: 'ticks.flash', meaningKey: 'cards.docBlock.tickMeaningBoulderFlash' },
			{ nameKey: 'ticks.send', meaningKey: 'cards.docBlock.tickMeaningBoulderSend' },
			{ nameKey: 'ticks.repeat', meaningKey: 'cards.docBlock.tickMeaningBoulderRepeat' },
			{ nameKey: 'ticks.dab', meaningKey: 'cards.docBlock.tickMeaningBoulderDab' }
		]
	},
	{
		groupKey: 'cards.docBlock.tickGroupTopRope',
		stylesKey: 'cards.docBlock.tickGroupTopRopeStyles',
		ticks: [
			{ nameKey: 'ticks.onsight', meaningKey: 'cards.docBlock.tickMeaningTopRopeOnsight' },
			{ nameKey: 'ticks.flash', meaningKey: 'cards.docBlock.tickMeaningTopRopeFlash' },
			{ nameKey: 'ticks.clean', meaningKey: 'cards.docBlock.tickMeaningTopRopeClean' },
			{ nameKey: 'ticks.ropedsolo', meaningKey: 'cards.docBlock.tickMeaningTopRopeRopedSolo' },
			{ nameKey: 'ticks.hangdog', meaningKey: 'cards.docBlock.tickMeaningTopRopeHangDog' }
		]
	},
	{
		groupKey: 'cards.docBlock.tickGroupAid',
		stylesKey: 'cards.docBlock.tickGroupAidStyles',
		ticks: [
			{ nameKey: 'ticks.tick', meaningKey: 'cards.docBlock.tickMeaningAidTick' },
			{ nameKey: 'ticks.aidsolo', meaningKey: 'cards.docBlock.tickMeaningAidSolo' },
			{ nameKey: 'ticks.freesolo', meaningKey: 'cards.docBlock.tickMeaningFreeSolo' }
		]
	},
	{
		groupKey: 'cards.docBlock.tickGroupAttempts',
		stylesKey: 'cards.docBlock.tickGroupAttemptsStyles',
		ticks: [
			{ nameKey: 'ticks.working', meaningKey: 'cards.docBlock.tickMeaningWorking' },
			{ nameKey: 'ticks.attempt', meaningKey: 'cards.docBlock.tickMeaningAttempt' },
			{ nameKey: 'ticks.retreat', meaningKey: 'cards.docBlock.tickMeaningRetreat' }
		]
	},
	{
		groupKey: 'cards.docBlock.tickGroupGeneral',
		stylesKey: 'cards.docBlock.tickGroupGeneralStyles',
		ticks: [{ nameKey: 'ticks.tick', meaningKey: 'cards.docBlock.tickMeaningGeneralTick' }]
	}
];

export function getTickDocs(locale?: SupportedLocale | null): readonly TickGroup[] {
	if (!locale || locale === 'en') return TICK_DOCS;
	return TICK_DOCS.map((g, gi) => {
		const metaG = TICK_DOCS_META[gi];
		const groupName = metaG ? formatMessage(locale, metaG.groupKey) : g.group;
		const styles = metaG ? formatMessage(locale, metaG.stylesKey) : g.styles;
		return {
			group: groupName || g.group,
			styles: styles || g.styles,
			ticks: g.ticks.map((t, ti) => {
				const metaT = metaG?.ticks[ti];
				const name = metaT?.nameKey ? formatMessage(locale, metaT.nameKey) : t.name;
				const meaning = metaT?.meaningKey ? formatMessage(locale, metaT.meaningKey) : t.meaning;
				return {
					name: name || t.name,
					meaning: meaning || t.meaning,
					send: t.send
				};
			})
		};
	});
}
