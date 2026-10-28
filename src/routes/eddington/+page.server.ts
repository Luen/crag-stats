import { getEddingtonPageData } from '#lib/server/eddingtonPage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => getEddingtonPageData();
