import { getDashboardStats } from '#lib/server/analytics';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { dateDisplay, displayUnits } = await parent();
	const stats = getDashboardStats(getDisplayGradeSystems(), { dateDisplay, displayUnits });
	return { badges: stats.badges };
};
