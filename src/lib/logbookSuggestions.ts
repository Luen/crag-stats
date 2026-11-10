/** Public cached values only; keys preserve identity when names repeat. */
export type LogbookSuggestion = { value: string; label: string; key?: string };

export function normalizeRock(value: string): string {
	return value.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function logbookAreaKey(
	row: {
		routeProvider: string;
		areaExternalId: string | null;
		cragName: string | null;
		parentExternalId?: string | null;
		parentName: string | null;
		cragPath?: string | null;
	},
	sector = false
): string {
	return JSON.stringify([
		row.routeProvider,
		sector ? 'sector' : 'crag',
		(sector ? row.parentExternalId : row.areaExternalId) || null,
		// Name/path fallback only when the cache has no provider identity.
		(sector ? row.parentExternalId : row.areaExternalId)
			? null
			: [row.cragPath, row.cragName, sector ? row.parentName : null]
	]);
}

export function matchingSuggestions(options: LogbookSuggestion[], query: string) {
	const needle = query.trim().toLowerCase();
	return options.filter((option) =>
		`${option.value} ${option.label}`.toLowerCase().includes(needle)
	);
}
