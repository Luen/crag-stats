/** Comparable community popularity score; counts are a separate unit. */
export function routePopularityScore(row: {
	popularity?: number | null;
	relativePopularity?: number | null;
}): number | null {
	if (row.relativePopularity != null && Number.isFinite(row.relativePopularity))
		return row.relativePopularity;
	if (row.popularity != null && Number.isFinite(row.popularity)) return row.popularity;
	return null;
}
