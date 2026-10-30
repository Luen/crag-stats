import { fail } from '@sveltejs/kit';
import {
	listWeatherLocationGroups,
	searchWeatherPlaces,
	chooseWeatherPlace,
	clearWeatherPlace
} from '#lib/server/weatherLocations';
import type { Actions, PageServerLoad } from './$types';
export const load: PageServerLoad = ({ locals }) => ({
	groups: locals.authed ? listWeatherLocationGroups() : []
});
export const actions: Actions = {
	search: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, { message: 'Log in to manage weather locations.' });
		const f = await request.formData();
		const areaKey = String(f.get('areaKey') ?? '');
		if (!listWeatherLocationGroups().some((g) => g.key === areaKey))
			return fail(400, { message: 'Unknown area.' });
		try {
			return {
				...(await searchWeatherPlaces(
					String(f.get('query') ?? ''),
					String(f.get('countryCode') ?? '')
				)),
				areaKey
			};
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Place lookup failed.' });
		}
	},
	choose: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, { message: 'Log in to manage weather locations.' });
		const f = await request.formData();
		try {
			chooseWeatherPlace(
				String(f.get('areaKey') ?? ''),
				String(f.get('queryKey') ?? ''),
				Number(f.get('id'))
			);
			return {
				message: 'Approximate weather place saved. Run the weather import to fetch its days.'
			};
		} catch (e) {
			return fail(400, { message: e instanceof Error ? e.message : 'Could not save place.' });
		}
	},
	clear: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, { message: 'Log in to manage weather locations.' });
		const f = await request.formData();
		clearWeatherPlace(String(f.get('areaKey') ?? ''));
		return { message: 'Nearby-place fallback removed.' };
	}
};
