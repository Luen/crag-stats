import type { GradeSystem } from '#lib/grades';
import type { WeatherConditionsView } from '#lib/weatherStats';
import type { WeekdayStatsView } from '#lib/weekdayStats';
import type { KarmaStats } from './karma';
import type { RoutePopularityStats } from './routePopularity';
import type { TrainingLoadView } from './trainingLoad';

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
	/** Prefer API decayed CPR when enough points exist; else approximate model */
	source: 'api' | 'approx';
};

export type RouteTag = { category: string; name: string };

/** One Eddington number; `needed` more qualifying days/routes reach `next`. */
export type EddingtonMetric = { value: number; next: number; needed: number };

export type EddingtonStats = {
	sends: EddingtonMetric;
	vertical: EddingtonMetric;
	verticalUnitM: number;
	routeGrade: EddingtonMetric;
	boulderGrade: EddingtonMetric;
	activeDays: number;
};

export type EddingtonTimelinePoint = {
	period: string;
	sendsE: number;
	verticalE: number;
	routeE: number;
	boulderE: number;
};

export type EddingtonMilestoneRow = {
	target: number;
	have: number;
	needed: number;
	progress: number;
};

export type EddingtonMilestoneTable = {
	key: 'sends' | 'vertical' | 'routeGrade' | 'boulderGrade';
	label: string;
	unit: number;
	qualifierLabel: string;
	rows: EddingtonMilestoneRow[];
};

type FirstAscentRange = {
	min: string;
	minBand: number | null;
	max: string;
	maxBand: number | null;
	/** Graded FAs in this range */
	count: number;
} | null;

/** Manual or imported first ascents (FA / FFA); see firstAscents.ts. */
export type FirstAscentStats = {
	total: number;
	/** Displayed FA/FFA routes whose saved mark came from public route history. */
	imported: number;
	fa: number;
	ffa: number;
	/** Routes where cached route history credits you as route setter (@login). */
	routesSet: number;
	/** Distinct currently cached FA/FFA or setter-credited routes eligible for snapshots. */
	routesPutUp: number;
	/**
	 * Estimated non-owner ticks on FA/FFA + setter routes from paired cached counts.
	 * Zero also covers unavailable data; use routesWithCommunityData to distinguish it.
	 */
	communityAscents: number;
	/** Community ticks on Sport gear style or bolted routes. */
	sportOrBoltedCommunityAscents: number;
	/** FA/setter routes that have paired route/owner count snapshots. */
	routesWithCommunityData: number;
	/**
	 * Per-route community impact (sorted by estimate desc). Compact card shows a prefix;
	 * missing snapshots keep othersAscents null (#147).
	 */
	communityRoutes: {
		routeExternalId: string;
		routeName: string | null;
		url: string | null;
		othersAscents: number | null;
		ascentCountFetchedAt: string | null;
		fromFa: boolean;
		faKind: 'FA' | 'FFA' | null;
		fromSetter: boolean;
		sportOrBolted: boolean;
		styleLabel: string | null;
	}[];
	byStyle: { style: string; count: number; color: string }[];
	/** Routes on Ewbank-based scores, shown in the preferred system */
	routeRange: FirstAscentRange;
	/** Boulders on the V-scale (or Font) */
	boulderRange: FirstAscentRange;
	firstYear: number | null;
	latestYear: number | null;
	recent: {
		routeId: number;
		routeName: string;
		kind: 'FA' | 'FFA';
		style: string;
		gradeLabel: string | null;
		band: number | null;
		cragName: string | null;
		url: string | null;
		date: string | null;
	}[];
};

export type SoloKind = 'toprope' | 'lead' | 'free' | 'dws' | 'aid';

/** Solo climbing by type, plus ascents with no partner tagged; see solo.ts. */
export type SoloStats = {
	/** Solo ascents of any kind */
	total: number;
	kinds: {
		kind: SoloKind;
		label: string;
		count: number;
		sends: number;
		hardest: {
			routeName: string;
			gradeLabel: string | null;
			band: number | null;
			url: string | null;
		} | null;
		first: string | null;
		latest: string | null;
	}[];
	/** Ascents (and sends) with nobody in theCrag's "with" field */
	unpartnered: number;
	unpartneredSends: number;
	totalAscents: number;
};

export type HeatmapDay = {
	date: string;
	count: number;
	sends: number;
	/** Metres climbed that day (ascent or route height). */
	heightM: number;
	/** Hardest send that day as theCrag band 1–5; null if no graded send. */
	maxBand: number | null;
};

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
	/** Every filter's pyramids, so the dashboard toggles them without a reload. */
	stylePyramidsByMode: Record<'all' | 'sends' | 'onsight', StylePyramid[]>;
	bandBreakdown: { band: number; name: string; count: number; color: string }[];
	notableByStyle: NotableRow[];
	notableByArea: NotableRow[];
	cpr: {
		sport: CprTimelineData;
		trad: CprTimelineData;
		boulder: CprTimelineData;
	};
	/** Routes (ranked on Ewbank) first, then boulders (ranked on V-scale). */
	hardestSends: {
		id: number;
		discipline: 'route' | 'boulder';
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
	eddington: EddingtonStats;
	firstAscents: FirstAscentStats;
	solo: SoloStats;
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
	monthly: {
		months: {
			month: string;
			byStyle: Record<string, number>;
			ascents: number;
			sends: number;
			heightM: number;
		}[];
		years: number[];
	};
	yearly: {
		years: {
			year: number;
			ascents: number;
			sends: number;
			onsights: number;
			heightM: number;
			deltaAscents: number | null;
			deltaHeightM: number | null;
			deltaOnsights: number | null;
		}[];
	};
	milestones: {
		items: { id: string; kind: string; label: string; date: string | null; detail: string }[];
	};
	badges: {
		earned: {
			id: string;
			title: string;
			hint: string;
			icon: string;
			tone: string;
			earned: boolean;
			detail: string | null;
			date: string | null;
			routeName: string | null;
			href: string | null;
		}[];
		locked: {
			id: string;
			title: string;
			hint: string;
			icon: string;
			tone: string;
			earned: boolean;
			detail: string | null;
			date: string | null;
			routeName: string | null;
			href: string | null;
		}[];
		earnedCount: number;
		totalCount: number;
		almost: { id: string; title: string; current: number; target: number; pct: number }[];
	};
	trainingLoad: TrainingLoadView;
	sessionsPerWeek: {
		years: string[];
		byYear: Record<string, { weekStart: string; week: number; sessions: number }[]>;
	};
	/** Mon–Sun session/ascent pie; hide when allTime.all.totalSessions is 0. */
	weekday: WeekdayStatsView;
	styleMix: {
		months: { month: string; Sport: number; Trad: number; Boulder: number; Other: number }[];
	};
	partners: {
		name: string;
		count: number;
		ascents: number;
		sessions: number;
		areas: number;
	}[];
	starsScatter: {
		stars: number | null;
		qualityScore: number | null;
		score: number;
		kind: 'route' | 'boulder';
		routeName: string;
		url: string | null;
	}[];
	qualityBreakdown: { quality: string; count: number }[];
	rockTypes: {
		types: { name: string; count: number; pct: number }[];
		dominant: string | null;
		dominantPct: number | null;
		info: { name: string; summary: string; tips: string } | null;
	};
	pyramidMode: 'all' | 'sends' | 'onsight';
	routePopularity: RoutePopularityStats | null;
	/** Approximate ascent karma; edit points unavailable without a karma API (#136). */
	karma: KarmaStats;
	/** cragCount 0 → hide Best months card. */
	bestMonths: BestMonthsView;
	/** Open-Meteo conditions on outdoor days; null (card hidden) until any day is cached (#272). */
	weatherConditions: WeatherConditionsView | null;
};

export type BestMonthsCrag = {
	crag: string;
	url: string | null;
	ascentCount: number;
	seasonality: number[];
	yourMonths: number[];
	peakMonth: number;
};

export type BestMonthsView = {
	cragCount: number;
	crags: BestMonthsCrag[];
};
