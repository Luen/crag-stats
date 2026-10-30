import { getDashboardStats } from '#lib/server/analytics';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const stats = getDashboardStats();
	return { items: stats.milestones.items };
};
