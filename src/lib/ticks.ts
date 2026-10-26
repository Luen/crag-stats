/** Normalize theCrag tick labels for icons / styling. */
export type TickKind =
	| 'onsight'
	| 'flash'
	| 'redpoint'
	| 'pinkpoint'
	| 'tick'
	| 'send'
	| 'clean'
	| 'toprope'
	| 'other';

export function tickKind(tick: string | null | undefined): TickKind {
	const t = (tick || '').trim().toLowerCase();
	if (!t) return 'other';
	if (t.includes('sight')) return 'onsight';
	if (t.includes('flash')) return 'flash';
	if (t.includes('pink')) return 'pinkpoint';
	if (t.includes('red') && t.includes('point')) return 'redpoint';
	if (t.includes('top') && t.includes('rope')) return 'toprope';
	if (t === 'top rope' || t === 'toprope' || t === 'tr') return 'toprope';
	if (t === 'clean') return 'clean';
	if (t === 'send') return 'send';
	if (t === 'tick') return 'tick';
	return 'other';
}

export const STYLE_BADGE_COLORS: Record<string, string> = {
	Sport: '#1d6fa5',
	Trad: '#e07a2f',
	Boulder: '#a12b4a',
	'Top rope': '#7b5ea7',
	Alpine: '#2a9d8f',
	Aid: '#6c757d',
	Unknown: '#9aa0a6'
};

export function styleBadgeColor(style: string | null | undefined): string {
	const key = (style || '').trim();
	if (STYLE_BADGE_COLORS[key]) return STYLE_BADGE_COLORS[key];
	const lower = key.toLowerCase();
	if (lower.includes('boulder')) return STYLE_BADGE_COLORS.Boulder;
	if (lower.includes('trad')) return STYLE_BADGE_COLORS.Trad;
	if (lower.includes('sport')) return STYLE_BADGE_COLORS.Sport;
	if (lower.includes('top')) return STYLE_BADGE_COLORS['Top rope'];
	if (lower.includes('alpine')) return STYLE_BADGE_COLORS.Alpine;
	if (lower.includes('aid')) return STYLE_BADGE_COLORS.Aid;
	return STYLE_BADGE_COLORS.Unknown;
}
