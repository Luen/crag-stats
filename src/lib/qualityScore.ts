/** Ascent quality label → rough 0–100 for sort when route has no qualityScore. */
export function ascentQualityRank(quality: string | null | undefined): number {
	const s = (quality || '').toLowerCase();
	if (s.includes('classic') || s.includes('*****') || s === '5') return 5;
	if (s.includes('****') || s === '4') return 4;
	if (s.includes('***') || s === '3') return 3;
	if (s.includes('**') || s === '2') return 2;
	if (s.includes('*') || s === '1') return 1;
	return 0;
}

/** Map 0–3 stars onto 0–100 for scatter fallback when qualityScore is missing. */
export function starsAsQualityFallback(stars: number): number {
	const clamped = Math.max(0, Math.min(3, stars));
	return (clamped / 3) * 100;
}

/** Y-axis value for stars scatter: qualityScore when present, else stars mapped to 0–100. */
export function scatterQualityY(
	stars: number | null | undefined,
	qualityScore: number | null | undefined
): number | null {
	if (qualityScore != null && Number.isFinite(qualityScore)) {
		return Math.max(0, Math.min(100, qualityScore));
	}
	if (stars != null && Number.isFinite(stars)) return starsAsQualityFallback(stars);
	return null;
}

/** Logbook / route quality sort key (higher = better). qualityScore beats label beats stars. */
export function routeQualitySortKey(input: {
	qualityScore?: number | null;
	quality?: string | null;
	stars?: number | null;
}): number {
	if (input.qualityScore != null && Number.isFinite(input.qualityScore)) {
		return input.qualityScore;
	}
	const rank = ascentQualityRank(input.quality);
	if (rank > 0) return rank * 20;
	if (input.stars != null && Number.isFinite(input.stars)) return starsAsQualityFallback(input.stars);
	return -1;
}
