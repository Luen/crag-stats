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
		summary: 'For the server owner: API sync or automatic CSV downloads with a saved theCrag login.'
	},
	{
		slug: 'badges',
		title: 'Badges',
		summary: 'Logbook milestones and the automatic First Moves import date.'
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
		slug: 'karma',
		title: 'Karma',
		summary: 'Approximate ascent karma from routes logged; guide-edit points wait on a theCrag API.'
	}
];

export function docPage(slug: string): DocPage | undefined {
	return DOC_PAGES.find((d) => d.slug === slug);
}

/** Band descriptions, paraphrased from theCrag's grades article. */
export const BAND_DOCS: Record<number, { routes: string; boulders: string; text: string }> = {
	1: {
		routes: '1–12',
		boulders: 'VB- to VB+',
		text: 'Your first days of climbing, often seconding or top-roping. Many people manage these on day one, though a few climbs at this level are still serious.'
	},
	2: {
		routes: '13–18',
		boulders: 'V0- to V0+',
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
