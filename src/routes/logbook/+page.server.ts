import { fail } from '@sveltejs/kit';
import { listLogbook } from '#lib/server/analytics';
import { getShowNotes } from '#lib/server/appSettings';
import { parseFirstAscentKind, routeExists, setFirstAscent } from '#lib/server/firstAscents';
import { notesVisible } from '#lib/server/notes';
import { isRouteHistoryImportEnabled } from '#lib/server/routeHistoryImport';
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

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function parseFaParam(raw: string | null): string {
	if (raw === 'FA' || raw === 'FFA' || raw === 'any' || raw === 'none') return raw;
	return '';
}

function parseHistoryParam(raw: string | null): string {
	return raw === 'pending' ? 'pending' : '';
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
	const style = url.searchParams.get('style') ?? '';
	const tick = url.searchParams.get('tick') ?? '';
	const crag = url.searchParams.get('crag') ?? '';
	const sector = url.searchParams.get('sector') ?? '';
	const sectorPath = sector ? [] : parseSectorPath(url.searchParams.get('sectorPath'));
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
	const quality = url.searchParams.get('quality') ?? '';
	const withPartner = url.searchParams.get('with') ?? '';
	const yearRaw = url.searchParams.get('year');
	const year = yearRaw != null && yearRaw !== '' ? Number(yearRaw) : undefined;
	const scoreRaw = url.searchParams.get('score');
	const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : undefined;
	const bandRaw = url.searchParams.get('band');
	const band = bandRaw != null && bandRaw !== '' ? Number(bandRaw) : undefined;
	const minStarsRaw = url.searchParams.get('minStars');
	const minStarsNum = minStarsRaw != null && minStarsRaw !== '' ? Number(minStarsRaw) : undefined;
	const minStars =
		minStarsNum != null && Number.isFinite(minStarsNum) && minStarsNum >= 1 && minStarsNum <= 3
			? Math.floor(minStarsNum)
			: undefined;
	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const limit = 50;
	const notesShown = notesVisible(getShowNotes().enabled, locals.authed);
	const { total, rows } = listLogbook({
		q: q || undefined,
		style: style || undefined,
		tick: tick || undefined,
		crag: crag || undefined,
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
		quality: quality || undefined,
		with: withPartner || undefined,
		minStars,
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
		style,
		tick,
		crag,
		sector,
		sectorPath,
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
		quality,
		with: withPartner,
		minStars: minStars ?? '',
		year: year != null && Number.isFinite(year) ? year : '',
		score: score != null && Number.isFinite(score) ? score : '',
		band: band != null && Number.isFinite(band) ? band : '',
		page,
		limit,
		pages: Math.max(1, Math.ceil(total / limit))
	};
};
