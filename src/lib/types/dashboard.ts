import type { GradeSystem } from '#lib/grades';

export type PyramidTickSegment = { tick: string; count: number; color: string };

export type StylePyramid = {
	style: string;
	total: number;
	system: GradeSystem;
	rows: {
		grade: string;
		score: number;
		band: number | null;
		color: string;
		total: number;
		segments: PyramidTickSegment[];
	}[];
};

export type NotableRow = {
	group: string;
	tickType: string;
	count: number;
	hardestGrade: string | null;
	hardestBand: number | null;
	hardestRoute: string | null;
	hardestUrl: string | null;
	hardestDate: string | null;
	hardestStars: number | null;
	bandShares: { band: number; name: string; count: number; color: string }[];
};

export type TimelineBucket = {
	period: string;
	label: string;
	volume: number;
	candles: { family: string; color: string; min: number; max: number; count: number }[];
	cprGrade: number | null;
	cprScore: number | null;
	onsightGrade: number | null;
	redpointGrade: number | null;
};

export type CprTimelineData = {
	buckets: TimelineBucket[];
	peakScore: number | null;
	currentScore: number | null;
	peakGrade: number | null;
	currentGrade: number | null;
};

export type DashboardStats = {
	profileName: string | null;
	climberType: string;
	totalAscents: number;
	totalSends: number;
	totalAttempts: number;
	onsightCount: number;
	heightM: number;
	heightKm: number;
	distinctRoutes: number;
	distinctCrags: number;
	preferredSystem: GradeSystem;
	styleShare: { style: string; count: number; pct: number; color: string }[];
	tickBreakdown: { tick: string; count: number }[];
	topCrags: { crag: string; count: number; maxGrade: string | null; maxBand: number | null }[];
	volumeByMonth: { month: string; count: number; sends: number }[];
	stylePyramids: StylePyramid[];
	bandBreakdown: { band: number; name: string; count: number; color: string }[];
	notableByStyle: NotableRow[];
	notableByArea: NotableRow[];
	cpr: {
		sport: CprTimelineData;
		trad: CprTimelineData;
		boulder: CprTimelineData;
	};
	hardestSends: {
		routeName: string;
		gradeRaw: string | null;
		gradeLabel: string | null;
		gradeBand: number | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		url: string | null;
	}[];
	recent: {
		id: number;
		routeName: string;
		gradeRaw: string | null;
		gradeLabel: string | null;
		gradeBand: number | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		isSend: boolean;
		isAttempt: boolean;
		url: string | null;
	}[];
};
