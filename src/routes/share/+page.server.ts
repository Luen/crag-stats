import { isPrivateHost } from '#lib/privateHost';
import { EMBED_CARDS } from '#lib/server/embedCards';
import type { PageServerLoad } from './$types';

const LABELS: Record<(typeof EMBED_CARDS)[number], { title: string; alt: string }> = {
	summary: { title: 'Summary', alt: 'My climbing stats' },
	eddington: { title: 'Eddington numbers', alt: 'My climbing Eddington numbers' },
	hardest: { title: 'Hardest sends', alt: 'My hardest climbing sends' }
};

export const load: PageServerLoad = ({ url }) => ({
	origin: url.origin,
	// Links and embeds built from this origin won't load for anyone outside this network.
	privateHost: isPrivateHost(url.hostname),
	cards: EMBED_CARDS.map((id) => ({ id, ...LABELS[id] }))
});
