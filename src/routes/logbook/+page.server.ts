import { logbookDates } from '#lib/logbookDates';
import { normalizeRock } from '#lib/logbookSuggestions';
import { logbookOptions } from '#lib/server/logbookOptions';
import { parseSoloKind } from '#lib/soloKind';
import { fail } from '@sveltejs/kit';
import { listLogbook } from '#lib/server/analytics';
import { getDisplayGradeSystems, getRouteGradeSystem, getShowNotes } from '#lib/server/appSettings';
import { parseFirstAscentKind, routeExists, setFirstAscent } from '#lib/server/firstAscents';
import { notesVisible } from '#lib/server/notes';
import { getProjectOverrides } from '#lib/server/projectOverrides';
import { saveProjectSelection } from '#lib/server/projectSelectionAction';
import { isRouteHistoryImportEnabled } from '#lib/server/routeHistoryImport';
import { isWeatherImportEnabled } from '#lib/server/weatherImport';
import { isWeatherFilterKey, parseWeatherHighBound, type WeatherFilterKey } from '#lib/weatherKeys';
import { routeGradeOptions } from '#lib/logbookFilters';
import { parseTagExactParams } from '#lib/routeTags';
import type { Actions, PageServerLoad } from './$types';

function parseSectorPath(raw: string | null): string[] {
	if (!raw || raw.length > 8000) return [];
	try {
		const value: unknown = JSON.parse(raw);
		return Array.isArray(value) &&
			value.length <= 40 &&
			value.every((part) => typeof part === 'string' && part.length > 0 && part.length <= 200)
			? value
			: [];
	} catch {
		return [];
	}
}

function parseFaParam(raw: string | null): string {
	if (raw === 'FA' || raw === 'FFA' || raw === 'any' || raw === 'none') return raw;
	return '';
}

function parseHistoryParam(raw: string | null): string {
	return raw === 'pending' ? 'pending' : '';
}

function parseProjectParam(raw: string | null): '' | 'yes' | 'no' {
	if (raw === 'yes' || raw === 'no') return raw;
	return '';
}

function parseSetterParam(raw: string | null): '' | 'me' | 'none' {
	if (raw === 'me' || raw === 'none') return raw;
	return '';
}

function parseWeatherParam(raw: string | null): WeatherFilterKey | '' {
	return isWeatherFilterKey(raw) ? raw : '';
}

function parsePartnersParam(raw: string | null): '' | 'has' | 'missing' {
	if (raw === 'has' || raw === 'missing') return raw;
	return '';
}

/** Multi-value query params (`?tick=a&tick=b`) plus comma-separated legacy singles. */
function multiParams(url: URL, key: string): string[] {
	const all = url.searchParams.getAll(key).flatMap((v) => v.split(','));
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of all) {
		const t = raw.trim();
		if (!t || seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	return out;
}

function parseScoreBound(raw: string | null): number | undefined {
	if (raw == null || raw === '') return undefined;
	const n = Number(raw);
	if (!Number.isFinite(n) || n < 1 || n > 39) return undefined;
	return Math.floor(n);
}

export const actions: Actions = {
	projectSelection: (event) => saveProjectSelection(event, false),
	/** Owner-only: mark (kind=FA|FFA) or unmark (kind empty) a route as a first ascent. */
	firstAscent: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, { message: 'Log in to mark first ascents' });
		const form = await request.formData();
		const provider = String(form.get('provider') || '');
		const route = String(form.get('route') || '');
		if (!routeExists(provider, route)) return fail(400, { message: 'Unknown route' });
		setFirstAscent(provider, route, parseFirstAscentKind(form.get('kind')));
		return { ok: true };
	}
};

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q') ?? '';
	const routeRaw = url.searchParams.get('route') ?? '';
	const routeNumber = Number(routeRaw);
	const route =
		/^\d+$/.test(routeRaw) && Number.isSafeInteger(routeNumber) && routeNumber > 0
			? routeNumber
			: undefined;
	const place = (url.searchParams.get('place') ?? '').slice(0, 2000);
	const mapVenue = url.searchParams.get('mapVenue') ?? '';
	const styles = multiParams(url, 'style');
	const ticks = multiParams(url, 'tick');
	const solo = parseSoloKind(url.searchParams.get('solo'));
	const qualities = multiParams(url, 'quality');
	const crag = url.searchParams.get('crag') ?? '';
	const sector = url.searchParams.get('sector') ?? '';
	const sectorPath = sector ? [] : parseSectorPath(url.searchParams.get('sectorPath'));
	const day = url.searchParams.get('day') ?? '';
	const fromRaw = url.searchParams.get('from') ?? '';
	const toRaw = url.searchParams.get('to') ?? '';
	const dates = logbookDates({
		from: fromRaw,
		to: toRaw,
		year: Number(url.searchParams.get('year')) || undefined,
		season: url.searchParams.get('season') ?? ''
	});
	const { from, to } = dates;
	const season = url.searchParams.get('season') ?? '';
	const sort = url.searchParams.get('sort') ?? 'date';
	const order = url.searchParams.get('order') ?? 'desc';
	const multipitch = url.searchParams.get('multipitch') === '1';
	const fa = parseFaParam(url.searchParams.get('fa'));
	// "Not checked yet" only means something to the owner while the import is on; otherwise it'd match every route.
	const historyFilter = locals.authed && isRouteHistoryImportEnabled();
	const history = historyFilter ? parseHistoryParam(url.searchParams.get('history')) : '';
	const project = parseProjectParam(url.searchParams.get('project'));
	const setter = parseSetterParam(url.searchParams.get('setter'));
	const withPartner = url.searchParams.get('with') ?? '';
	const partners = parsePartnersParam(url.searchParams.get('partners'));
	const missingRaw = multiParams(url, 'missing');
	// missing=weather is an owner tool for the import backlog, so visitors never get it.
	const missing = missingRaw
		.map((v) => (v === 'pitches' ? 'pitch' : v))
		.filter(
			(v): v is 'height' | 'bolts' | 'pitch' | 'weather' =>
				v === 'height' || v === 'bolts' || v === 'pitch' || (v === 'weather' && locals.authed)
		);
	const weather = parseWeatherParam(url.searchParams.get('weather'));
	const weatherHighMin = parseWeatherHighBound(url.searchParams.get('weatherHighMin'));
	const weatherHighMax = parseWeatherHighBound(url.searchParams.get('weatherHighMax'));
	const tag = url.searchParams.get('tag') ?? '';
	const tagExact = parseTagExactParams(url.searchParams.getAll('tagExact'));
	const partnerMatch = url.searchParams.get('partnerMatch') === 'exact' ? 'exact' : 'contains';
	const rock = normalizeRock(url.searchParams.get('rock') ?? '');
	const options = logbookOptions();
	const cragKey = url.searchParams.get('cragKey') ?? '';
	const sectorKey = url.searchParams.get('sectorKey') ?? '';
	const routeName = url.searchParams.get('routeName') ?? '';
	const yearRaw = url.searchParams.get('year');
	const year = yearRaw != null && yearRaw !== '' ? Number(yearRaw) : undefined;
	const scoreRaw = url.searchParams.get('score');
	const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : undefined;
	const bandRaw = url.searchParams.get('band');
	const band = bandRaw != null && bandRaw !== '' ? Number(bandRaw) : undefined;
	const tcMinRaw = url.searchParams.get('tcMin');
	const tcMaxRaw = url.searchParams.get('tcMax');
	const tcMin = tcMinRaw ? Number(tcMinRaw) : NaN;
	const tcMax = tcMaxRaw ? Number(tcMaxRaw) : NaN;
	const tcRange = Number.isFinite(tcMin) && Number.isFinite(tcMax) ? { tcMin, tcMax } : null;
	const scaleRaw = url.searchParams.get('gradeScale');
	const gradeScale = scaleRaw === 'route' || scaleRaw === 'v' ? scaleRaw : undefined;
	const minScore = parseScoreBound(url.searchParams.get('minScore'));
	const maxScore = parseScoreBound(url.searchParams.get('maxScore'));
	const minStarsRaw = url.searchParams.get('minStars');
	const minStarsNum = minStarsRaw != null && minStarsRaw !== '' ? Number(minStarsRaw) : undefined;
	const minStars =
		minStarsNum != null && Number.isFinite(minStarsNum) && minStarsNum >= 1 && minStarsNum <= 3
			? Math.floor(minStarsNum)
			: undefined;
	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const limit = 50;
	const notesShown = notesVisible(getShowNotes().enabled, locals.authed);
	const gradeSystem = getRouteGradeSystem();
	const { total, rows, weatherAvailable } = listLogbook({
		q: q || undefined,
		route,
		place,
		mapVenue,
		styles: styles.length ? styles : undefined,
		ticks: ticks.length ? ticks : undefined,
		solo,
		qualities: qualities.length ? qualities : undefined,
		crag: crag || undefined,
		cragKey: cragKey || undefined,
		sectorKey: sectorKey || undefined,
		routeName: routeName || undefined,
		sector: sector || undefined,
		sectorPath: sectorPath.length ? sectorPath : undefined,
		day: day || undefined,
		from: from || undefined,
		to: to || undefined,
		season: season || undefined,
		sort: sort || undefined,
		order: order || undefined,
		multipitch: multipitch || undefined,
		fa: fa || undefined,
		history: history || undefined,
		project: project || undefined,
		setter: setter || undefined,
		with: withPartner || undefined,
		partners: partners || undefined,
		missing: missing.length ? missing : undefined,
		weather: weather || undefined,
		weatherHighMin,
		weatherHighMax,
		tag: tag || undefined,
		tagExact: tagExact.length ? tagExact : undefined,
		partnerMatch,
		rock: rock || undefined,
		minStars,
		minScore,
		maxScore,
		tcMin: tcRange?.tcMin,
		tcMax: tcRange?.tcMax,
		gradeSystems: getDisplayGradeSystems(),
		gradeScale,
		year: year != null && Number.isFinite(year) ? year : undefined,
		score: score != null && Number.isFinite(score) ? score : undefined,
		band: band != null && Number.isFinite(band) ? band : undefined,
		limit,
		offset: (page - 1) * limit,
		includeNotes: notesShown
	});
	return {
		options,
		dateError: dates.error,
		today: new Date().toISOString().slice(0, 10),
		total,
		route: route ?? '',
		rows,
		notesShown,
		canMarkFirstAscents: locals.authed,
		projectSelections: locals.authed ? Object.fromEntries(getProjectOverrides()) : null,
		q,
		place,
		mapVenue,
		styles,
		ticks,
		solo,
		qualities,
		crag,
		cragKey,
		sectorKey,
		routeName,
		sector,
		sectorPath,
		day,
		from,
		to,
		season: from || to ? '' : season,
		sort,
		order,
		multipitch,
		fa,
		history,
		historyFilter,
		project,
		setter,
		with: withPartner,
		partners,
		missing,
		weather,
		weatherHighMin: weatherHighMin ?? ('' as const),
		weatherHighMax: weatherHighMax ?? ('' as const),
		weatherAvailable,
		canFilterMissingWeather: locals.authed && (weatherAvailable || isWeatherImportEnabled()),
		tag,
		tagExact: tagExact.map((t) => `${t.category}:${t.name}`),
		partnerMatch,
		rock,
		minStars: minStars ?? '',
		minScore: minScore ?? '',
		maxScore: maxScore ?? '',
		tcMin: tcRange?.tcMin ?? '',
		tcMax: tcRange?.tcMax ?? '',
		gradeScale: gradeScale ?? '',
		gradeOptions: routeGradeOptions(gradeSystem),
		year: year != null && Number.isFinite(year) ? year : '',
		score: score != null && Number.isFinite(score) ? score : '',
		band: band != null && Number.isFinite(band) ? band : '',
		page,
		limit,
		pages: Math.max(1, Math.ceil(total / limit))
	};
};
