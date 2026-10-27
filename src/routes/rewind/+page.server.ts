import { getRewindSummary, listRewindYears } from '#lib/server/rewind';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const years = listRewindYears();
	const raw = url.searchParams.get('year');
	const requested = raw != null && raw !== '' ? Number(raw) : NaN;
	const year =
		Number.isFinite(requested) && years.includes(requested)
			? requested
			: (years[0] ?? new Date().getFullYear());

	return {
		years,
		year,
		summary: getRewindSummary(year)
	};
};
