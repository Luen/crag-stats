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
};
