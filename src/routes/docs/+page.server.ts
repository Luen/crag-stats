import { error } from '@sveltejs/kit';
import { DOC_PAGES } from '#lib/docs';
import { loadDoc } from '#lib/server/docs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const intro = loadDoc('index');
	if (!intro) error(404, 'Docs not found');
	return {
		intro,
		pages: DOC_PAGES,
		og: { title: 'Docs · Crag Stats', description: 'How Crag Stats works out your climbing stats.' }
	};
};
