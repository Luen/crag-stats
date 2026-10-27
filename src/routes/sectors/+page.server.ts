import { listCragMapPoints, listSectors } from '#lib/server/sectors';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		crags: listSectors(),
		mapPoints: listCragMapPoints()
	};
};
