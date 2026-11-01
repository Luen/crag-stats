import { currentSeasonalityMonth, readSeasonalityFilters } from '#lib/seasonality';
import { searchSeasonality } from '#lib/server/seasonality';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, parent }) => {
	const { dateDisplay } = await parent();
	const currentMonth = currentSeasonalityMonth(new Date(), dateDisplay.timeZone);
	const filters = readSeasonalityFilters(url.searchParams, currentMonth);
	const result = searchSeasonality(filters);
	return { ...result, filters: { ...filters, page: result.page } };
};
