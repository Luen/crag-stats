import { listLogbook } from '#lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const style = url.searchParams.get('style') ?? '';
	const tick = url.searchParams.get('tick') ?? '';
	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const limit = 50;
	const { total, rows } = listLogbook({
		q: q || undefined,
		style: style || undefined,
		tick: tick || undefined,
		limit,
		offset: (page - 1) * limit
	});
	return { total, rows, q, style, tick, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
};
