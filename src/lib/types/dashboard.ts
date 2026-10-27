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
		/** Logbook filter link for routes at this grade */
		href: string;
	}[];
};

export type NotableRow = {
	group: string;
	/** Link for the group when it is an area/crag name */
	groupUrl: string | null;
	tickType: string;
	count: number;
	hardestGrade: string | null;
	hardestBand: number | null;
	hardestRoute: string | null;
	hardestUrl: string | null;
	hardestDate: string | null;
	hardestStars: number | null;
	/** e.g. P1 when only some pitches of a multipitch were climbed */
	hardestPitchLabel: string | null;
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

export type RouteTag = { category: string; name: string };

export type HeatmapDay = { date: string; count: number; sends: number };

export type DashboardStats = {
	profileName: string | null;
	climberType: string;
	avatar: string | null;
	totalAscents: number;
	totalSends: number;
	totalAttempts: number;
	onsightCount: number;
	outdoorAscents: number | null;
	indoorAscents: number | null;
	routesTicked: number;
	heightM: number;
	heightKm: number;
	distinctRoutes: number;
	distinctCrags: number;
	preferredSystem: GradeSystem;
	heatmap: HeatmapDay[];
	styleShare: { style: string; count: number; pct: number; color: string }[];
	tickBreakdown: { tick: string; count: number }[];
	topCrags: {
		crag: string;
		count: number;
		maxGrade: string | null;
		maxBand: number | null;
		url: string | null;
	}[];
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
		pitchLabel: string | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		cragUrl: string | null;
		url: string | null;
	}[];
	recent: {
		id: number;
		routeName: string;
		gradeRaw: string | null;
		gradeLabel: string | null;
		gradeBand: number | null;
		pitchLabel: string | null;
		tickType: string | null;
		ascentDate: string | null;
		cragName: string | null;
		cragUrl: string | null;
		isSend: boolean;
		isAttempt: boolean;
		partners: string | null;
		quality: string | null;
		tags: RouteTag[];
		url: string | null;
	}[];
	blurb: {
		startedOn: string | null;
		durationLabel: string | null;
		paragraphs: string[];
	};
	streaks: {
		currentDays: number;
		currentWeeks: number;
		currentMonths: number;
		longestDays: number;
		lastActiveDate: string | null;
	};
	athleteProfile: {
		axes: { key: string; label: string; last30: number; last90: number }[];
	};
};
