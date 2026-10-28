import { fail } from '@sveltejs/kit';
import { listLogbook } from '#lib/server/analytics';
import { getPreferredGradeSystem, getShowNotes } from '#lib/server/appSettings';
import { parseFirstAscentKind, routeExists, setFirstAscent } from '#lib/server/firstAscents';
import { notesVisible } from '#lib/server/notes';
import { isRouteHistoryImportEnabled } from '#lib/server/routeHistoryImport';
import { routeGradeOptions } from '#lib/logbookFilters';
import type { Actions, PageServerLoad } from './$types';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseFaParam(raw: string | null): string {
	if (raw === 'FA' || raw === 'FFA' || raw === 'any' || raw === 'none') return raw;
	return '';
}

function parseHistoryParam(raw: string | null): string {
	return raw === 'pending' ? 'pending' : '';
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
	const styles = multiParams(url, 'style');
	const ticks = multiParams(url, 'tick');
	const qualities = multiParams(url, 'quality');
	const crag = url.searchParams.get('crag') ?? '';
	const sector = url.searchParams.get('sector') ?? '';
	const day = url.searchParams.get('day') ?? '';
	const fromRaw = url.searchParams.get('from') ?? '';
	const toRaw = url.searchParams.get('to') ?? '';
	const from = ISO_DAY.test(fromRaw) ? fromRaw : '';
	const to = ISO_DAY.test(toRaw) ? toRaw : '';
	const season = url.searchParams.get('season') ?? '';
	const sort = url.searchParams.get('sort') ?? 'date';
	const order = url.searchParams.get('order') ?? 'desc';
	const multipitch = url.searchParams.get('multipitch') === '1';
	const fa = parseFaParam(url.searchParams.get('fa'));
	// "Not checked yet" only means something to the owner while the import is on; otherwise it'd match every route.
	const historyFilter = locals.authed && isRouteHistoryImportEnabled();
	const history = historyFilter ? parseHistoryParam(url.searchParams.get('history')) : '';
	const withPartner = url.searchParams.get('with') ?? '';
	const partners = parsePartnersParam(url.searchParams.get('partners'));
	const missingRaw = multiParams(url, 'missing');
	const missing = missingRaw.filter(
		(v): v is 'height' | 'bolts' => v === 'height' || v === 'bolts'
	);
	const tag = url.searchParams.get('tag') ?? '';
	const yearRaw = url.searchParams.get('year');
	const year = yearRaw != null && yearRaw !== '' ? Number(yearRaw) : undefined;
	const scoreRaw = url.searchParams.get('score');
	const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : undefined;
	const bandRaw = url.searchParams.get('band');
	const band = bandRaw != null && bandRaw !== '' ? Number(bandRaw) : undefined;
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
	const gradeSystem = getPreferredGradeSystem();
	const { total, rows } = listLogbook({
		q: q || undefined,
		styles: styles.length ? styles : undefined,
		ticks: ticks.length ? ticks : undefined,
		qualities: qualities.length ? qualities : undefined,
		crag: crag || undefined,
		sector: sector || undefined,
		day: day || undefined,
		from: from || undefined,
		to: to || undefined,
		season: season || undefined,
		sort: sort || undefined,
		order: order || undefined,
		multipitch: multipitch || undefined,
		fa: fa || undefined,
		history: history || undefined,
		with: withPartner || undefined,
		partners: partners || undefined,
		missing: missing.length ? missing : undefined,
		tag: tag || undefined,
		minStars,
		minScore,
		maxScore,
		year: year != null && Number.isFinite(year) ? year : undefined,
		score: score != null && Number.isFinite(score) ? score : undefined,
		band: band != null && Number.isFinite(band) ? band : undefined,
		limit,
		offset: (page - 1) * limit,
		includeNotes: notesShown
	});
	return {
		total,
		rows,
		notesShown,
		canMarkFirstAscents: locals.authed,
		q,
		styles,
		ticks,
		qualities,
		crag,
		sector,
		day,
		from,
		to,
		season,
		sort,
		order,
		multipitch,
		fa,
		history,
		historyFilter,
		with: withPartner,
		partners,
		missing,
		tag,
		minStars: minStars ?? '',
		minScore: minScore ?? '',
		maxScore: maxScore ?? '',
		gradeOptions: routeGradeOptions(gradeSystem),
		year: year != null && Number.isFinite(year) ? year : '',
		score: score != null && Number.isFinite(score) ? score : '',
		band: band != null && Number.isFinite(band) ? band : '',
		page,
		limit,
		pages: Math.max(1, Math.ceil(total / limit))
	};
};
