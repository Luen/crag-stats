import { listLogbook } from '#lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const style = url.searchParams.get('style') ?? '';
	const tick = url.searchParams.get('tick') ?? '';
	const crag = url.searchParams.get('crag') ?? '';
	const day = url.searchParams.get('day') ?? '';
	const yearRaw = url.searchParams.get('year');
	const year = yearRaw != null && yearRaw !== '' ? Number(yearRaw) : undefined;
	const scoreRaw = url.searchParams.get('score');
	const score = scoreRaw != null && scoreRaw !== '' ? Number(scoreRaw) : undefined;
	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const limit = 50;
	const { total, rows } = listLogbook({
		q: q || undefined,
		style: style || undefined,
		tick: tick || undefined,
		crag: crag || undefined,
		day: day || undefined,
		year: year != null && Number.isFinite(year) ? year : undefined,
		score: score != null && Number.isFinite(score) ? score : undefined,
		limit,
		offset: (page - 1) * limit
	});
	return {
		total,
		rows,
		q,
		style,
		tick,
		crag,
		day,
		year: year != null && Number.isFinite(year) ? year : '',
		score: score != null && Number.isFinite(score) ? score : '',
		page,
		limit,
		pages: Math.max(1, Math.ceil(total / limit))
	};
};
