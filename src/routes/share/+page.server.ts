import { formatMessage } from '#lib/i18n';
import { isPrivateHost } from '#lib/privateHost';
import { EMBED_CARDS } from '#lib/server/embedCards';
import type { PageServerLoad } from './$types';

const LABEL_KEYS: Record<(typeof EMBED_CARDS)[number], { titleKey: string; altKey: string }> = {
	summary: {
		titleKey: 'pages.share.cardSummaryTitle',
		altKey: 'pages.share.cardSummaryAlt'
	},
	eddington: {
		titleKey: 'pages.share.cardEddingtonTitle',
		altKey: 'pages.share.cardEddingtonAlt'
	},
	hardest: {
		titleKey: 'pages.share.cardHardestTitle',
		altKey: 'pages.share.cardHardestAlt'
	}
};

export const load: PageServerLoad = ({ url, locals }) => ({
	origin: url.origin,
	// Links and embeds built from this origin won't load for anyone outside this network.
	privateHost: isPrivateHost(url.hostname),
	cards: EMBED_CARDS.map((id) => ({
		id,
		title: formatMessage(locals.locale, LABEL_KEYS[id].titleKey),
		alt: formatMessage(locals.locale, LABEL_KEYS[id].altKey)
	}))
});
