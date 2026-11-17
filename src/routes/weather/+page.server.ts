import { getWeatherPageData } from '#lib/server/weatherPage';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => getWeatherPageData(undefined, locals.locale);
