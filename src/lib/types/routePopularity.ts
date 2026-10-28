export type HiddenGemItem = {
	routeName: string;
	gradeLabel: string | null;
	cragName: string | null;
	url: string | null;
	stars: number | null;
	qualityScore: number | null;
	ascentCount: number | null;
	popularityLabel: string | null;
};

export type RoutePopularityStats = {
	withData: number;
	totalAscents: number;
	busy: { count: number; pct: number };
	quiet: { count: number; pct: number };
	hiddenGems: HiddenGemItem[];
};
