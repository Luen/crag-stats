import { applyDisplaySystemOverrides } from '#lib/grades';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
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

	// Site default from Settings; `?system=` / `?boulderSystem=` are one-off overrides, as on the dashboard.
	const gradeSystems = applyDisplaySystemOverrides(getDisplayGradeSystems(), url.searchParams);

	return {
		years,
		year,
		summary: getRewindSummary(year, gradeSystems)
	};
};
