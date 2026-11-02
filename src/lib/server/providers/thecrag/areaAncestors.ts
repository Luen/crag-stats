/** Both logbook keyed ancestors and route API ancestor arrays occur upstream. */
export function record(value: unknown): Record<string, unknown> | null {
	return value != null && typeof value === 'object' && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: null;
}

export function areaId(value: unknown): string | null {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
		? String(value)
		: typeof value === 'string' && value.trim() !== ''
			? value.trim()
			: null;
}

export function climbingArea(node: Record<string, unknown> | null): boolean {
	return Boolean(
		node &&
		areaId(node.id) &&
		node.isCountry !== 1 &&
		node.isCountry !== true &&
		node.isCountry !== '1' &&
		![node.subType, node.type, node.areaType].some((v) =>
			/^(world|country|continent|state|province|region)$/i.test(String(v ?? ''))
		)
	);
}

export function routeAreas(raw: unknown): {
	TLC: Record<string, unknown> | null;
	parent: Record<string, unknown> | null;
} {
	const route = record(raw);
	const ancestors = route?.ancestors;
	let tlc: Record<string, unknown> | null;
	let parent: Record<string, unknown> | null;
	if (Array.isArray(ancestors)) {
		const nodes = ancestors.map(record).filter((n) => n != null);
		tlc = nodes.find((n) => n.isTLC === 1 || n.isTLC === true || n.isTLC === '1') ?? null;
		const id = areaId(route?.parentID);
		parent = id ? (nodes.find((n) => areaId(n.id) === id) ?? null) : null;
	} else {
		const keyed = record(ancestors);
		tlc = record(keyed?.TLC);
		parent = record(keyed?.parent);
		const countryId = areaId(record(keyed?.country)?.id);
		if (countryId && areaId(tlc?.id) === countryId) tlc = null;
		if (countryId && areaId(parent?.id) === countryId) parent = null;
	}
	return { TLC: climbingArea(tlc) ? tlc : null, parent: climbingArea(parent) ? parent : null };
}
