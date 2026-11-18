import { error } from '@sveltejs/kit';
import { docPage } from '#lib/docs';
import { loadDoc } from '#lib/server/docs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	const doc = loadDoc(params.slug, locals.locale);
	const page = docPage(params.slug, locals.locale);
	if (!doc || !page) error(404, 'Doc not found');
	return {
		doc,
		og: { title: `${doc.title || page.title} · Crag Stats docs`, description: page.summary }
	};
};
