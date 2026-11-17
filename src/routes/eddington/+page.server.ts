import { getEddingtonPageData } from '#lib/server/eddingtonPage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => getEddingtonPageData(locals.locale);
