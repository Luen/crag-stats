import { listClimbingMap, readMapFilters } from '#lib/server/climbingMap';
import type { PageServerLoad } from './$types';
export const load: PageServerLoad = ({ url }) => {
	const filters = readMapFilters(url.searchParams);
	return { ...listClimbingMap(filters), filters };
};
