import { parseGradeSystem } from '#lib/server/analytics';
import { getPreferredGradeSystem } from '#lib/server/appSettings';
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

	// Site default from Settings; `?system=` is a one-off override, as on the dashboard.
	const fromQuery = url.searchParams.get('system');
	const preferred = fromQuery ? parseGradeSystem(fromQuery) : getPreferredGradeSystem();

	return {
		years,
		year,
		summary: getRewindSummary(year, preferred)
	};
};
