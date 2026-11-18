import { error } from '@sveltejs/kit';
import { docPages } from '#lib/docs';
import { formatMessage } from '#lib/i18n/format';
import { loadDoc } from '#lib/server/docs';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const intro = loadDoc('index', locals.locale);
	if (!intro) error(404, 'Docs not found');
	return {
		intro,
		pages: docPages(locals.locale),
		og: {
			title: `${formatMessage(locals.locale, 'pages.docs.pageTitle')} · Crag Stats`,
			description: formatMessage(locals.locale, 'pages.docs.pageDescription')
		}
	};
};
