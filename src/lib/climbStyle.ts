/** Client-safe provider style labels shared by logbook filters and ascent labels. */
export function climbStyleLabel(raw: string | null | undefined): string {
	const s = (raw ?? '')
		.trim()
		.toLowerCase()
		.replace(/[\s_-]+/g, ' ');
	if (s.includes('boulder')) return 'Boulder';
	if (s.includes('trad')) return 'Trad';
	if (s.includes('sport')) return 'Sport';
	if (s === 'toprope' || s === 'top rope' || s === 'top roping') return 'Top rope';
	if (s === 'dws' || s === 'deep water solo') return 'Deep water solo';
	if (s === 'solo' || s === 'free solo') return 'Free solo';
	if (s.includes('aid')) return 'Aid';
	if (s.includes('alpine')) return 'Alpine';
	return 'Other';
}

export function matchesClimbStyle(raw: string | null | undefined, wanted: string): boolean {
	const value = (raw ?? '').trim().toLowerCase();
	const needle = wanted.trim().toLowerCase();
	if (!value || !needle) return false;
	const label = climbStyleLabel(value);
	const wantedLabel = climbStyleLabel(needle);
	return value.includes(needle) || (label !== 'Other' && label === wantedLabel);
}
