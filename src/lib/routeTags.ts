export type RouteTag = { category: string; name: string; source?: 'route' | 'ancestor' };

export function parseTagsJson(raw: string | null | undefined): RouteTag[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(t): t is RouteTag =>
					!!t &&
					typeof t === 'object' &&
					typeof (t as { category?: unknown }).category === 'string' &&
					typeof (t as { name?: unknown }).name === 'string'
			)
			.map((t) => ({
				category: t.category,
				name: t.name,
				...(t.source === 'route' || t.source === 'ancestor' ? { source: t.source } : {})
			}));
	} catch {
		return [];
	}
}

/** Case-insensitive trim match on category and name (same rules as rock=). */
export function routeTagExactKey(category: string, name: string): string {
	return `${category.trim().toLowerCase()}\0${name.trim().toLowerCase()}`;
}

export function routeHasExactTag(
	tagsJson: string | null | undefined,
	category: string,
	name: string
): boolean {
	const want = routeTagExactKey(category, name);
	return parseTagsJson(tagsJson).some((t) => routeTagExactKey(t.category, t.name) === want);
}

/** Parse `Category:Name` from a tagExact URL value; invalid values return null. */
export function parseTagExactParam(raw: string): RouteTag | null {
	const trimmed = raw.trim();
	if (!trimmed) return null;
	const colon = trimmed.indexOf(':');
	if (colon <= 0 || colon >= trimmed.length - 1) return null;
	const category = trimmed.slice(0, colon).trim();
	const name = trimmed.slice(colon + 1).trim();
	if (!category || !name) return null;
	return { category, name };
}

export function parseTagExactParams(values: string[]): RouteTag[] {
	const seen = new Set<string>();
	const out: RouteTag[] = [];
	for (const raw of values) {
		const tag = parseTagExactParam(raw);
		if (!tag) continue;
		const key = `${routeTagExactKey(tag.category, tag.name)}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push(tag);
	}
	return out;
}
