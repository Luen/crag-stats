import { fail } from '@sveltejs/kit';
import { listLogbook } from '#lib/server/analytics';
import { getShowNotes } from '#lib/server/appSettings';
import { parseFirstAscentKind, routeExists, setFirstAscent } from '#lib/server/firstAscents';
import { notesVisible } from '#lib/server/notes';
import type { Actions, PageServerLoad } from './$types';

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
	const day = url.searchParams.get('day') ?? '';
	const season = url.searchParams.get('season') ?? '';
	const sort = url.searchParams.get('sort') ?? 'date';
	const order = url.searchParams.get('order') ?? 'desc';
	const multipitch = url.searchParams.get('multipitch') === '1';
	const yearRaw = url.searchParams.get('year');
	const year = yearRaw != null && yearRaw !== '' ? Number(yearRaw) : undefined;
	const scoreRaw = url.searchParams.get('score');
	const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : undefined;
	const bandRaw = url.searchParams.get('band');
	const band = bandRaw != null && bandRaw !== '' ? Number(bandRaw) : undefined;
	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const limit = 50;
	const notesShown = notesVisible(getShowNotes().enabled, locals.authed);
	const { total, rows } = listLogbook({
		q: q || undefined,
		style: style || undefined,
		tick: tick || undefined,
		crag: crag || undefined,
		sector: sector || undefined,
		day: day || undefined,
		season: season || undefined,
		sort: sort || undefined,
		order: order || undefined,
		multipitch: multipitch || undefined,
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
		day,
		season,
		sort,
		order,
		multipitch,
		year: year != null && Number.isFinite(year) ? year : '',
		score: score != null && Number.isFinite(score) ? score : '',
		band: band != null && Number.isFinite(band) ? band : '',
		page,
		limit,
		pages: Math.max(1, Math.ceil(total / limit))
	};
};
