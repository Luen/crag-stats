import { getDashboardStats } from '#lib/server/analytics';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stats = getDashboardStats(getDisplayGradeSystems());
	return { badges: stats.badges };
};
