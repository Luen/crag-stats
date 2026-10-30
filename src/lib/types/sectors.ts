import type { VisitClimate } from '#lib/visitClimate';

export type SectorNode = {
	name: string;
	routeCount: number;
	ascentCount: number;
	children?: SectorNode[];
	multipitchRouteCount?: number;
	styleMismatchRouteCount?: number;
};

export type CragSectorGroup = {
	cragName: string;
	routeCount: number;
	ascentCount: number;
	areaBreadcrumb?: string;
	hasAreaTree: boolean;
	sectors: SectorNode[];
	/** Cached weather on your visits (>= 5 days); null otherwise (#278). Not climate normals. */
	visitClimate?: VisitClimate | null;
};
