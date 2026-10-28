/** Shared approximate 0–100 fallback for theCrag's personal quality labels. */
const QUALITY_LABELS: Record<string, number> = {
	crap: 0,
	"don't bother": 15,
	average: 35,
	good: 55,
	'very good': 75,
	classic: 90,
	'mega classic': 100
};
export function ascentQualityScore(quality: string | null | undefined): number | null {
	const label = (quality ?? '').trim().toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, ' ');
	if (Object.hasOwn(QUALITY_LABELS, label)) return QUALITY_LABELS[label];
	if (/^[1-5]$/.test(label)) return Number(label) * 20;
	if (/^\*{1,5}$/.test(label)) return label.length * 20;
	return null;
}
export function starsAsQualityFallback(stars: number): number {
	return (Math.max(0, Math.min(3, stars)) / 3) * 100;
}
export function scatterQualityY(
	stars: number | null | undefined,
	qualityScore: number | null | undefined
): number | null {
	if (qualityScore != null && Number.isFinite(qualityScore))
		return Math.max(0, Math.min(100, qualityScore));
	return stars != null && Number.isFinite(stars) ? starsAsQualityFallback(stars) : null;
}
/** Route score wins, then a known personal label (including zero), then stars. */
export function routeQualitySortKey(input: {
	qualityScore?: number | null;
	quality?: string | null;
	stars?: number | null;
}): number {
	if (input.qualityScore != null && Number.isFinite(input.qualityScore)) return input.qualityScore;
	const personal = ascentQualityScore(input.quality);
	if (personal != null) return personal;
	if (input.stars != null && Number.isFinite(input.stars))
		return starsAsQualityFallback(input.stars);
	return -1;
}
