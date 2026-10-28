/**
 * Public guidebook beta cached in `routes.beta_json` (#81).
 * Never mix with private ascent notes (`ascents.comment`).
 */

export type StoredRouteBeta = {
	description?: string;
	accessIssues?: string;
	access?: string;
	ethic?: string;
	ethics?: string;
	approach?: string;
	attributionUrl?: string;
};

export type ProjectPublicBeta = {
	descriptionExcerpt: string | null;
	accessWarning: string | null;
	attributionUrl: string | null;
};

export const CARD_BETA_DESC_MAX = 220;
export const CARD_ACCESS_WARNING_MAX = 180;

export function parseStoredRouteBeta(json: string | null | undefined): StoredRouteBeta | null {
	if (!json?.trim()) return null;
	try {
		const o = JSON.parse(json) as Record<string, unknown>;
		if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
		const out: StoredRouteBeta = {};
		for (const key of [
			'description',
			'accessIssues',
			'access',
			'ethic',
			'ethics',
			'approach',
			'attributionUrl'
		] as const) {
			const v = o[key];
			if (typeof v === 'string' && v.trim()) out[key] = v;
		}
		return Object.keys(out).length ? out : null;
	} catch {
		return null;
	}
}

export function plainTextFromMarkdown(md: string): string {
	let t = md.trim();
	t = t.replace(/!\[[^\]]*]\([^)]*\)/g, '');
	t = t.replace(/\[([^\]]+)]\([^)]*\)/g, '$1');
	t = t.replace(/`([^`]+)`/g, '$1');
	t = t.replace(/^#{1,6}\s+/gm, '');
	t = t.replace(/(\*\*|__|\*|_|~~)/g, '');
	t = t.replace(/\s+/g, ' ').trim();
	return t;
}

export function truncatePlain(text: string, max: number): string {
	if (text.length <= max) return text;
	const slice = text.slice(0, max);
	const lastSpace = slice.lastIndexOf(' ');
	const cut = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
	return `${cut}…`;
}

function accessText(stored: StoredRouteBeta): string | null {
	return stored.accessIssues ?? stored.access ?? null;
}

export function projectPublicBetaFromJson(
	json: string | null | undefined,
	fallbackRouteUrl?: string | null
): ProjectPublicBeta | null {
	const stored = parseStoredRouteBeta(json);
	if (!stored) return null;

	const accessRaw = accessText(stored);
	const accessPlain = accessRaw ? plainTextFromMarkdown(accessRaw) : null;
	const descRaw = stored.description?.trim();
	const descPlain = descRaw ? plainTextFromMarkdown(descRaw) : null;
	const attributionUrl = stored.attributionUrl ?? fallbackRouteUrl ?? null;

	if (!accessPlain && !descPlain && !attributionUrl) return null;

	return {
		accessWarning: accessPlain ? truncatePlain(accessPlain, CARD_ACCESS_WARNING_MAX) : null,
		descriptionExcerpt: descPlain ? truncatePlain(descPlain, CARD_BETA_DESC_MAX) : null,
		attributionUrl
	};
}
