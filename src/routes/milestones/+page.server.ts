import { getDashboardStats } from '#lib/server/analytics';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { dateDisplay, displayUnits } = await parent();
	const stats = getDashboardStats(getDisplayGradeSystems(), {
		dateDisplay,
		displayUnits,
		locale: locals.locale
	});
	return { items: stats.milestones.items };
};
