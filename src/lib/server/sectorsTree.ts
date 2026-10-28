/** Pure helpers for /sectors hierarchy from route API ancestor chains (#82). */

import type { SectorNode } from '#lib/types/sectors';

export type { SectorNode } from '#lib/types/sectors';

export type AncestorEntry = { id?: number | string; name?: string };

export type SectorTreeStats = {
	routeIds: Set<number>;
	ascentCount: number;
	multipitchRoutes: number;
	styleMismatchRoutes: number;
};

export type SectorTreeNode = SectorTreeStats & {
	name: string;
	children: Map<string, SectorTreeNode>;
};

const WORLD_NAMES = new Set(['world']);

export function parseAncestorsJson(json: string | null | undefined): AncestorEntry[] | null {
	if (!json?.trim()) return null;
	try {
		const v = JSON.parse(json) as unknown;
		if (Array.isArray(v)) {
			const entries = v.filter(
				(x): x is AncestorEntry =>
					!!x && typeof x === 'object' && typeof (x as AncestorEntry).name === 'string'
			);
			return entries.length ? entries : null;
		}
		if (v && typeof v === 'object') {
			const o = v as Record<string, unknown>;
			const chain: AncestorEntry[] = [];
			const country = o.country as { name?: string } | undefined;
			if (country?.name?.trim()) chain.push({ name: country.name.trim() });
			const tlc = o.TLC as { name?: string; id?: number | string } | undefined;
			const parent = o.parent as { name?: string; id?: number | string } | undefined;
			if (tlc?.name?.trim()) {
				const name = tlc.name.trim();
				if (!chain.some((c) => namesEqual(c.name!, name))) chain.push({ id: tlc.id, name });
			}
			if (parent?.name?.trim()) {
				const name = parent.name.trim();
				if (!chain.some((c) => namesEqual(c.name!, name))) {
					chain.push({ id: parent.id, name });
				}
			}
			return chain.length ? chain : null;
		}
	} catch {
		/* invalid json */
	}
	return null;
}

function namesEqual(a: string, b: string): boolean {
	return a.localeCompare(b, undefined, { sensitivity: 'accent' }) === 0;
}

export function ancestorAreaNames(ancestors: AncestorEntry[] | null): string[] {
	if (!ancestors?.length) return [];
	const names = ancestors.map((a) => a.name!.trim()).filter(Boolean);
	while (names.length && WORLD_NAMES.has(names[0]!.toLowerCase())) names.shift();
	return names;
}

export function sectorPathUnderCrag(input: {
	ancestorsJson: string | null | undefined;
	cragName: string;
	parentName: string | null | undefined;
}): { segments: string[]; usedAncestors: boolean } {
	const fallback = [(input.parentName || 'General').trim() || 'General'];
	const parsed = parseAncestorsJson(input.ancestorsJson);
	const names = ancestorAreaNames(parsed);
	if (!names.length) return { segments: fallback, usedAncestors: false };

	const crag = (input.cragName || 'Unknown').trim() || 'Unknown';
	const cragIdx = names.findIndex((n) => namesEqual(n, crag));
	if (cragIdx >= 0) {
		const below = names.slice(cragIdx + 1);
		if (below.length) return { segments: below, usedAncestors: true };
	}

	const parent = (input.parentName || '').trim();
	if (parent) {
		const parentIdx = names.findIndex((n) => namesEqual(n, parent));
		if (parentIdx >= 0) return { segments: names.slice(parentIdx), usedAncestors: true };
		return { segments: [parent], usedAncestors: false };
	}

	return { segments: fallback, usedAncestors: false };
}

export function pitchCountFromJson(json: string | null | undefined): number {
	if (!json?.trim()) return 0;
	try {
		const v = JSON.parse(json);
		return Array.isArray(v) ? v.length : 0;
	} catch {
		return 0;
	}
}

const STYLE_FLAGS: Record<string, string> = {
	issport: 'Sport',
	istrad: 'Trad',
	isboulder: 'Boulder'
};

export function styleFromFlagsJson(json: string | null | undefined): string | null {
	if (!json?.trim()) return null;
	try {
		const v = JSON.parse(json);
		if (!Array.isArray(v)) return null;
		const styles = new Set<string>();
		for (const raw of v) {
			if (typeof raw !== 'string') continue;
			const mapped = STYLE_FLAGS[raw.trim().toLowerCase()];
			if (mapped) styles.add(mapped);
		}
		return styles.size === 1 ? [...styles][0]! : null;
	} catch {
		return null;
	}
}

export function gearStyleMismatch(
	gearStyle: string | null | undefined,
	flagsJson: string | null
): boolean {
	const fromFlags = styleFromFlagsJson(flagsJson);
	if (!fromFlags) return false;
	const gear = (gearStyle || '').trim();
	if (!gear) return false;
	return !namesEqual(fromFlags, gear);
}

export function emptyTreeNode(name: string): SectorTreeNode {
	return {
		name,
		routeIds: new Set(),
		ascentCount: 0,
		multipitchRoutes: 0,
		styleMismatchRoutes: 0,
		children: new Map()
	};
}

export function insertSectorPath(
	root: Map<string, SectorTreeNode>,
	segments: string[],
	routeId: number,
	ascentCount: number,
	opts: { multipitch: boolean; styleMismatch: boolean }
): void {
	const path = segments.length ? segments : ['General'];
	let level = root;
	for (let i = 0; i < path.length; i++) {
		const name = path[i]!;
		let node = level.get(name);
		if (!node) {
			node = emptyTreeNode(name);
			level.set(name, node);
		}
		node.routeIds.add(routeId);
		node.ascentCount += ascentCount;
		if (opts.multipitch) node.multipitchRoutes += 1;
		if (opts.styleMismatch) node.styleMismatchRoutes += 1;
		if (i < path.length - 1) level = node.children;
	}
}

export function treeNodeToSectorNode(node: SectorTreeNode): SectorNode {
	const children = [...node.children.values()]
		.map(treeNodeToSectorNode)
		.sort((a, b) => b.ascentCount - a.ascentCount || a.name.localeCompare(b.name));
	const out: SectorNode = {
		name: node.name,
		routeCount: node.routeIds.size,
		ascentCount: node.ascentCount
	};
	if (node.multipitchRoutes > 0) out.multipitchRouteCount = node.multipitchRoutes;
	if (node.styleMismatchRoutes > 0) out.styleMismatchRouteCount = node.styleMismatchRoutes;
	if (children.length) out.children = children;
	return out;
}

export function sectorTreeHasDepth(nodes: SectorNode[]): boolean {
	for (const n of nodes) {
		if (n.children?.length) return true;
	}
	return false;
}
