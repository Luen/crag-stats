import { listPartners } from '#lib/server/partners';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({
	partners: listPartners()
});
