import { matchesClimbStyle } from '#lib/climbStyle';
import { ancestorAreaNames, parseAncestorsJson, sectorPathUnderCrag } from './sectorsTree';
import { desc, eq, sql } from 'drizzle-orm';
import {
	bandById,
	bandFromEwbank,
	bandFromVScale,
	boulderPyramidScoreKey,
	convertFromEwbank,
	convertFromVScale,
	formatVScaleLabel,
	GRADE_BANDS,
	type GradeSystem,
	usesVScale
} from '#lib/grades';
import type { DashboardStats, NotableRow, StylePyramid } from '#lib/types/dashboard';
import { rockTypeBlurb, rockTypeInfo } from '#lib/rockTypes';
import { resolveTheCragAvatar } from '#lib/thecragAvatar';
import { theCragAscentUrl } from '#lib/thecragUrls';
import { styleBadgeColor, tickKind } from '#lib/ticks';
import {
	buildRouteAscentCounts,
	parseLogbookSortKey,
	routeKey,
	routePopularity,
	sortLogbookRows
} from './logbookSort';
import { buildCprTimeline } from './cpr';
import { buildBadges } from './badges';
import { countOwnerSetRoutes, setterBadgeHits } from './routeSetters';
import {
	buildMilestones,
	buildMonthlyStats,
	buildPartnerLeaderboard,
	splitPartners,
	buildQualityBreakdown,
	buildRockTypeStats,
	buildStarsScatter,
	buildStyleMixOverTime,
	buildYearlyStats,
	firstAscentSends
} from './dashboardExtras';
import { db, ensureSchema } from './db';
import { buildEddington } from './eddington';
import { buildSoloStats } from './solo';
import {
	buildFirstAscentStats,
	firstAscentKindFor,
	getFirstAscentMarks,
	type FirstAscentRow
} from './firstAscents';
import { ascents, profiles, routeHistoryFetches, routes } from './db/schema';
import { pickHardestSends } from './hardestSends';
import { invalidateRouteHistoryRuns } from './routeHistoryEngine';
import { buildTrainingLoadView, hasPersonalAscentGrade } from './trainingLoad';
import { buildRoutePopularityStats } from './routePopularity';
import { buildBestMonthsView } from './bestMonths';

export type PyramidMode = 'all' | 'sends' | 'onsight';
const PYRAMID_MODES: PyramidMode[] = ['all', 'sends', 'onsight'];

export function parsePyramidMode(raw: string | null | undefined): PyramidMode {
	const v = (raw || '').trim().toLowerCase();
	if (v === 'sends' || v === 'send') return 'sends';
	if (v === 'onsight' || v === 'onsights') return 'onsight';
	return 'all';
}

function linkFor(row: { ascentUrl: string | null; ascentExternalId: string; url: string | null }) {
	return row.ascentUrl || theCragAscentUrl(row.ascentExternalId) || row.url;
}

export type { DashboardStats, NotableRow, StylePyramid } from '#lib/types/dashboard';

const TICK_ORDER = [
	'Onsight',
	'Flash',
	'Red point',
	'Pink point',
	'Tick',
	'Send',
	'Clean',
	'Repeat',
	'Top rope',
	'Second',
	'Attempt'
];

function tickSortKey(tick: string): number {
	const exact = TICK_ORDER.indexOf(tick);
	if (exact >= 0) return exact;
	const lower = tick.toLowerCase();
	const soft = TICK_ORDER.findIndex((t) => lower.includes(t.toLowerCase().split(' ')[0]));
	return soft >= 0 ? soft : 50;
}

const TICK_COLORS: Record<string, string> = {
	Onsight: '#54b41a',
	Flash: '#fee100',
	'Red point': '#c90909',
	'Pink point': '#e83e8c',
	Tick: '#1d6fa5',
	Send: '#1d6fa5',
	Clean: '#54b41a',
	Other: '#c5c5c5'
};

function monthKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	return iso.slice(0, 7);
}

/** Strict YYYY-MM-DD with real calendar month/day (rejects 2018-00-00 etc.). */
function validDay(iso: string | null | undefined): string | null {
	const d = (iso || '').slice(0, 10);
	const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return null;
	const year = Number(m[1]);
	const month = Number(m[2]);
	const day = Number(m[3]);
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const dt = new Date(`${d}T12:00:00`);
	if (Number.isNaN(dt.getTime())) return null;
	// Reject JS date rollover (e.g. 2024-02-31 → March)
	if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) return null;
	return d;
}

function displayStyle(gearStyle: string | null | undefined): string {
	const s = (gearStyle || '').trim();
	if (!s) return 'Unknown';
	const lower = s.toLowerCase();
	if (lower.includes('boulder')) return 'Boulder';
	if (lower.includes('trad')) return 'Trad';
	if (lower.includes('sport')) return 'Sport';
	if (lower.includes('top')) return 'Top rope';
	if (lower.includes('alpine')) return 'Alpine';
	if (lower.includes('aid')) return 'Aid';
	return s.charAt(0).toUpperCase() + s.slice(1);
}

function tickColor(tick: string): string {
	if (TICK_COLORS[tick]) return TICK_COLORS[tick];
	const t = tick.toLowerCase();
	if (t.includes('sight')) return TICK_COLORS.Onsight;
	if (t.includes('flash')) return TICK_COLORS.Flash;
	if (t.includes('pink')) return TICK_COLORS['Pink point'];
	if (t.includes('red')) return TICK_COLORS['Red point'];
	if (t.includes('send') || t === 'tick') return TICK_COLORS.Send;
	return TICK_COLORS.Other;
}

function formatGrade(
	score: number,
	isBoulder: boolean,
	system: GradeSystem,
	raw?: string | null
): string {
	if (isBoulder) {
		if (system === 'font') return convertFromVScale(score, 'font');
		return formatVScaleLabel(score, raw);
	}
	const routeSystem: GradeSystem = system === 'v_scale' || system === 'font' ? 'ewbank' : system;
	return convertFromEwbank(score, routeSystem);
}

/** Pyramid key suffix for V-graded routes that aren't boulders (DWS, highball), #72. */
const V_SUFFIX = ' · V';

/** Score is V-scale, from the route's stored grade system (gear style only as fallback). */
function vScale(row: { gradeSystem?: string | null; gearStyle: string | null }): boolean {
	return usesVScale(row.gradeSystem, row.gearStyle);
}

function effectiveScore(row: {
	effectiveGradeScore: number | null;
	gradeScore: number | null;
}): number | null {
	return row.effectiveGradeScore ?? row.gradeScore;
}

function effectiveRaw(row: {
	effectiveGradeRaw: string | null;
	gradeRaw: string | null;
}): string | null {
	return row.effectiveGradeRaw ?? row.gradeRaw;
}

function effectiveBand(row: {
	effectiveGradeBand: number | null;
	gradeBand: number | null;
}): number | null {
	return row.effectiveGradeBand ?? row.gradeBand;
}

function displayRouteName(
	name: string,
	pitchLabel: string | null | undefined,
	ascentLabel?: string | null
): string {
	const label = ascentLabel?.trim();
	const base = label || name;
	if (!pitchLabel) return base;
	if (base.toLowerCase().includes(pitchLabel.toLowerCase())) return base;
	return `${base} (${pitchLabel})`;
}

function parseTagsJson(raw: string | null | undefined): { category: string; name: string }[] {
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return [];
		return parsed
			.filter(
				(t): t is { category: string; name: string } =>
					!!t &&
					typeof t === 'object' &&
					typeof (t as { category?: unknown }).category === 'string' &&
					typeof (t as { name?: unknown }).name === 'string'
			)
			.map((t) => ({ category: t.category, name: t.name }));
	} catch {
		return [];
	}
}

function relativeTime(iso: string | null): string | null {
	if (!iso) return null;
	const then = new Date(iso);
	if (Number.isNaN(then.getTime())) return null;
	const years = (Date.now() - then.getTime()) / (365.25 * 24 * 3600 * 1000);
	if (years < 1 / 12) return 'this month';
	if (years < 1) return `${Math.max(1, Math.round(years * 12))} months ago`;
	if (years < 1.5) return '1 year ago';
	return `${Math.round(years)} years ago`;
}

export function parseGradeSystem(raw: string | null | undefined): GradeSystem {
	const v = (raw || '').toLowerCase();
	if (v === 'yds' || v === 'french' || v === 'ewbank' || v === 'v_scale' || v === 'font') return v;
	return 'ewbank';
}

export function getDashboardStats(
	preferredSystem: GradeSystem = 'ewbank',
	opts?: { pyramidMode?: PyramidMode }
): DashboardStats {
	const pyramidMode = opts?.pyramidMode ?? 'all';
	ensureSchema();
	// Cheap: fill missing ascent logbook links without a full re-parse
	db.run(
		sql`UPDATE ascents SET ascent_url = 'https://www.thecrag.com/ascent/' || external_id
			WHERE provider = 'thecrag' AND (ascent_url IS NULL OR ascent_url = '')`
	);

	const profile = db.select().from(profiles).limit(1).get();
	// Backfill / repair profile fields from stored account JSON
	if (profile?.rawJson && (profile.outdoorAscentCount == null || !profile.avatar)) {
		try {
			const acct = JSON.parse(profile.rawJson) as {
				avatar?: unknown;
				typeOfClimber?: string;
				outdoorAscentCount?: number;
				indoorAscentCount?: number;
				heightClimbed?: number | [number, string];
				routesTicked?: number;
			};
			const height =
				typeof acct.heightClimbed === 'number'
					? acct.heightClimbed
					: Array.isArray(acct.heightClimbed)
						? Number(acct.heightClimbed[0])
						: null;
			const patched = {
				avatar: resolveTheCragAvatar(acct.avatar) ?? profile.avatar ?? null,
				typeOfClimber: acct.typeOfClimber ?? profile.typeOfClimber ?? null,
				outdoorAscentCount:
					acct.outdoorAscentCount != null
						? Number(acct.outdoorAscentCount)
						: profile.outdoorAscentCount,
				indoorAscentCount:
					acct.indoorAscentCount != null
						? Number(acct.indoorAscentCount)
						: profile.indoorAscentCount,
				heightClimbed: height != null && Number.isFinite(height) ? height : profile.heightClimbed,
				routesTicked: acct.routesTicked != null ? Number(acct.routesTicked) : profile.routesTicked
			};
			db.update(profiles).set(patched).where(eq(profiles.id, profile.id)).run();
			Object.assign(profile, patched);
		} catch (err) {
			console.warn(
				'[analytics] profile backfill skipped:',
				err instanceof Error ? err.message : err
			);
		}
	}
	const all = db
		.select({
			id: ascents.id,
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			heightM: ascents.heightM,
			ascentGearStyle: ascents.ascentGearStyle,
			effectiveGradeRaw: ascents.effectiveGradeRaw,
			effectiveGradeScore: ascents.effectiveGradeScore,
			effectiveGradeBand: ascents.effectiveGradeBand,
			pitchLabel: ascents.pitchLabel,
			ascentLabel: ascents.ascentLabel,
			partners: ascents.partners,
			quality: ascents.quality,
			ascentUrl: ascents.ascentUrl,
			ascentExternalId: ascents.externalId,
			routeId: routes.id,
			routeProvider: routes.provider,
			routeExternalId: routes.externalId,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeScore: routes.gradeScore,
			gradeBand: routes.gradeBand,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			cragName: routes.cragName,
			cragUrl: routes.cragUrl,
			url: routes.url,
			stars: routes.stars,
			qualityScore: routes.qualityScore,
			routeHeightM: routes.heightM,
			tagsJson: routes.tagsJson,
			parentName: routes.parentName,
			country: routes.country,
			routeIsProject: routes.isProject,
			gradeProvenanceJson: ascents.rawJson,
			seasonalityJson: routes.seasonalityJson,
			numberAttempts: ascents.numberAttempts,
			cprDecayedGrade: ascents.cprDecayedGrade,
			cprDecayedScore: ascents.cprDecayedScore,
			cprBase: ascents.cprBase,
			cprScore: ascents.cprScore,
			ascentCount: routes.ascentCount,
			popularity: routes.popularity,
			relativePopularity: routes.relativePopularity
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.all();

	const tickMap = new Map<string, number>();
	const styleMap = new Map<string, number>();
	const cragMap = new Map<
		string,
		{
			count: number;
			maxScore: number;
			maxGrade: string | null;
			maxBand: number | null;
			url: string | null;
		}
	>();
	const monthMap = new Map<string, { count: number; sends: number }>();
	const bandMap = new Map<number, number>();
	const routeSet = new Set<number>();
	let heightM = 0;
	let sends = 0;
	let attempts = 0;
	let onsightCount = 0;
	let flashCount = 0;
	let redpointCount = 0;
	let pinkpointCount = 0;

	// mode -> style -> scoreKey -> { segments, band, isBoulder }. Every mode is built in the
	// one pass so the dashboard can switch filters client-side, without a reload.
	type PyramidAgg = Map<
		string,
		Map<number, { ticks: Map<string, number>; band: number | null; isBoulder: boolean }>
	>;
	const pyramids: Record<PyramidMode, PyramidAgg> = {
		all: new Map(),
		sends: new Map(),
		onsight: new Map()
	};

	type NotableAgg = {
		count: number;
		bandCounts: Map<number, number>;
		hardest: (typeof all)[number] | null;
	};
	const notableStyle = new Map<string, NotableAgg>();
	const notableArea = new Map<string, NotableAgg>();

	for (const row of all) {
		routeSet.add(row.routeId);
		const tick = row.tickType || 'Unknown';
		tickMap.set(tick, (tickMap.get(tick) ?? 0) + 1);
		const style = displayStyle(row.gearStyle);
		styleMap.set(style, (styleMap.get(style) ?? 0) + 1);

		const h = row.heightM ?? row.routeHeightM ?? 0;
		if (h) heightM += h;
		if (row.isSend) sends += 1;
		if (row.isAttempt) attempts += 1;
		const kind = tickKind(row.tickType);
		if (kind === 'onsight') onsightCount += 1;
		else if (kind === 'flash') flashCount += 1;
		else if (kind === 'redpoint') redpointCount += 1;
		else if (kind === 'pinkpoint') pinkpointCount += 1;

		const crag = row.cragName || 'Unknown';
		const prev = cragMap.get(crag) ?? {
			count: 0,
			maxScore: -Infinity,
			maxGrade: null,
			maxBand: null,
			url: row.cragUrl
		};
		prev.count += 1;
		if (!prev.url && row.cragUrl) prev.url = row.cragUrl;
		const rowScore = effectiveScore(row);
		const rowRaw = effectiveRaw(row);
		const rowBand = effectiveBand(row);
		const score = rowScore ?? -Infinity;
		if (score > prev.maxScore) {
			prev.maxScore = score;
			prev.maxGrade = rowRaw;
			prev.maxBand = rowBand;
		}
		cragMap.set(crag, prev);

		const month = monthKey(row.ascentDate);
		if (month) {
			const m = monthMap.get(month) ?? { count: 0, sends: 0 };
			m.count += 1;
			if (row.isSend) m.sends += 1;
			monthMap.set(month, m);
		}

		const isBoulder = vScale(row);
		// Boulder bands always from V-score (theCrag table). Stored bands can be
		// Ewbank-derived and paint V0 green.
		const band =
			rowScore != null && isBoulder
				? (bandFromVScale(rowScore)?.id ?? null)
				: (rowBand ?? (rowScore != null ? (bandFromEwbank(rowScore)?.id ?? null) : null));

		if (row.isSend && band) bandMap.set(band, (bandMap.get(band) ?? 0) + 1);

		for (const mode of PYRAMID_MODES) {
			const includeInPyramid =
				mode === 'onsight'
					? kind === 'onsight'
					: mode === 'sends'
						? row.isSend
						: row.isSend || row.isAttempt;
			if (!includeInPyramid || rowScore == null) continue;
			const pyramid = pyramids[mode];
			const baseKey = style === 'Top rope' ? 'Top rope' : style;
			// A V-graded DWS/highball gets its own pyramid ("DWS · V"), never mixed with Ewbank (#72).
			const styleKey = isBoulder && baseKey !== 'Boulder' ? `${baseKey}${V_SUFFIX}` : baseKey;
			if (!pyramid.has(styleKey)) pyramid.set(styleKey, new Map());
			const byGrade = pyramid.get(styleKey)!;
			// Boulder: keep VB+ out of V0; merge V0-/V0/V0+. Routes: integer score.
			const key = isBoulder ? boulderPyramidScoreKey(rowScore) : Math.round(rowScore);
			const slot = byGrade.get(key) ?? {
				ticks: new Map<string, number>(),
				band,
				isBoulder
			};
			const tickKey = row.isAttempt ? 'Other' : tick;
			slot.ticks.set(tickKey, (slot.ticks.get(tickKey) ?? 0) + 1);
			// Prefer Intermediate for a merged V0 row if any V0± landed here.
			if (band != null && (slot.band == null || band > slot.band)) slot.band = band;
			byGrade.set(key, slot);
		}

		const bumpNotable = (map: Map<string, NotableAgg>, group: string, tickType: string) => {
			const key = `${group}||${tickType}`;
			const agg = map.get(key) ?? { count: 0, bandCounts: new Map(), hardest: null };
			agg.count += 1;
			if (band) agg.bandCounts.set(band, (agg.bandCounts.get(band) ?? 0) + 1);
			const hardestScore = agg.hardest ? effectiveScore(agg.hardest) : null;
			if (rowScore != null && (!agg.hardest || (hardestScore ?? -Infinity) < rowScore)) {
				agg.hardest = row;
			}
			map.set(key, agg);
		};

		if (row.isSend) {
			bumpNotable(notableStyle, style, tick);
			bumpNotable(notableArea, crag, tick);
		}
	}

	const totalForShare = Math.max(1, all.length);
	const styleShare = [...styleMap.entries()]
		.map(([style, count]) => ({
			style,
			count,
			pct: Math.round((count / totalForShare) * 1000) / 10,
			color: styleBadgeColor(style)
		}))
		.sort((a, b) => b.count - a.count);

	const dominant = styleShare[0];
	const climberType =
		profile?.typeOfClimber?.trim() ||
		(dominant && dominant.pct >= 40 && ['Sport', 'Trad', 'Boulder'].includes(dominant.style)
			? `${dominant.style} climber`
			: 'Rock climber');

	const dayMap = new Map<string, { count: number; sends: number }>();
	for (const row of all) {
		const day = validDay(row.ascentDate);
		if (!day) continue;
		const slot = dayMap.get(day) ?? { count: 0, sends: 0 };
		slot.count += 1;
		if (row.isSend) slot.sends += 1;
		dayMap.set(day, slot);
	}
	const heatmap = [...dayMap.entries()]
		.map(([date, v]) => ({ date, count: v.count, sends: v.sends }))
		.sort((a, b) => a.date.localeCompare(b.date));

	const styleOrder = ['Boulder', 'Sport', 'Trad', 'Top rope', 'Alpine', 'Aid'];
	const buildStylePyramids = (pyramid: PyramidAgg): StylePyramid[] =>
		[...pyramid.entries()]
			.sort((a, b) => {
				const ia = styleOrder.indexOf(a[0]);
				const ib = styleOrder.indexOf(b[0]);
				return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
			})
			.map(([style, grades]) => {
				const isBoulder = style === 'Boulder' || style.endsWith(V_SUFFIX);
				const baseStyle = style.endsWith(V_SUFFIX) ? style.slice(0, -V_SUFFIX.length) : style;
				const system: GradeSystem = isBoulder
					? preferredSystem === 'font'
						? 'font'
						: 'v_scale'
					: preferredSystem === 'v_scale' || preferredSystem === 'font'
						? 'ewbank'
						: preferredSystem;

				const rows = [...grades.entries()]
					.map(([score, v]) => {
						const total = [...v.ticks.values()].reduce((s, n) => s + n, 0);
						const bandId = isBoulder ? (bandFromVScale(score)?.id ?? v.band) : v.band;
						const band = bandById(bandId ?? 0);
						const params = new URLSearchParams({
							style: baseStyle,
							score: String(score)
						});
						return {
							grade: formatGrade(score, isBoulder, preferredSystem, null),
							score,
							band: bandId,
							color: band?.color ?? '#888',
							total,
							href: `/logbook?${params.toString()}`,
							segments: [...v.ticks.entries()]
								.map(([tick, count]) => ({ tick, count, color: tickColor(tick) }))
								.sort((a, b) => b.count - a.count)
						};
					})
					.sort((a, b) => a.score - b.score);

				return {
					style,
					total: rows.reduce((s, r) => s + r.total, 0),
					system,
					rows
				};
			})
			.filter((p) => p.total > 0);
	const stylePyramidsByMode = Object.fromEntries(
		PYRAMID_MODES.map((mode) => [mode, buildStylePyramids(pyramids[mode])])
	) as Record<PyramidMode, StylePyramid[]>;
	const stylePyramids = stylePyramidsByMode[pyramidMode];

	const toNotableRows = (
		map: Map<string, NotableAgg>,
		groupMode: 'style' | 'area'
	): NotableRow[] => {
		const rows = [...map.entries()].map(([key, agg]) => {
			const [group, tickType] = key.split('||');
			const hardest = agg.hardest;
			const isBoulder = hardest ? vScale(hardest) : false;
			const hScore = hardest ? effectiveScore(hardest) : null;
			const hRaw = hardest ? effectiveRaw(hardest) : null;
			return {
				group,
				groupUrl: hardest?.cragUrl && hardest.cragName === group ? hardest.cragUrl : null,
				tickType,
				count: agg.count,
				hardestGrade: hScore != null ? formatGrade(hScore, isBoulder, preferredSystem, hRaw) : hRaw,
				hardestBand: hardest ? effectiveBand(hardest) : null,
				hardestRoute: hardest
					? displayRouteName(hardest.routeName, hardest.pitchLabel, hardest.ascentLabel)
					: null,
				hardestUrl: hardest ? linkFor(hardest) : null,
				hardestDate: relativeTime(hardest?.ascentDate ?? null),
				hardestStars: hardest?.stars ?? null,
				hardestPitchLabel: hardest?.pitchLabel ?? null,
				bandShares: GRADE_BANDS.map((b) => ({
					band: b.id,
					name: b.name,
					count: agg.bandCounts.get(b.id) ?? 0,
					color: b.color
				}))
			};
		});

		if (groupMode === 'style') {
			const styleTotals = new Map<string, number>();
			for (const r of rows) styleTotals.set(r.group, (styleTotals.get(r.group) ?? 0) + r.count);
			return rows.sort((a, b) => {
				const ta = styleTotals.get(a.group) ?? 0;
				const tb = styleTotals.get(b.group) ?? 0;
				if (tb !== ta) return tb - ta;
				const ia = styleOrder.indexOf(a.group);
				const ib = styleOrder.indexOf(b.group);
				if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
				const tickDiff = tickSortKey(a.tickType) - tickSortKey(b.tickType);
				if (tickDiff !== 0) return tickDiff;
				return b.count - a.count;
			});
		}

		const areaTotals = new Map<string, number>();
		for (const r of rows) areaTotals.set(r.group, (areaTotals.get(r.group) ?? 0) + r.count);
		return rows.sort((a, b) => {
			const ta = areaTotals.get(a.group) ?? 0;
			const tb = areaTotals.get(b.group) ?? 0;
			if (tb !== ta) return tb - ta;
			if (a.group !== b.group) return a.group.localeCompare(b.group);
			const tickDiff = tickSortKey(a.tickType) - tickSortKey(b.tickType);
			if (tickDiff !== 0) return tickDiff;
			return b.count - a.count;
		});
	};

	const parseCprGradeNum = (raw: string | null | undefined): number | null => {
		if (!raw) return null;
		const n = Number(String(raw).replace(/^[Vv]/, '').trim());
		return Number.isFinite(n) ? n : null;
	};

	const cprInputs = all.map((a) => ({
		routeId: a.routeId,
		ascentDate: a.ascentDate,
		tickType: a.tickType,
		gradeScore: effectiveScore(a),
		gearStyle: a.gearStyle,
		isSend: a.isSend,
		isAttempt: a.isAttempt,
		apiCprGrade: parseCprGradeNum(a.cprDecayedGrade) ?? parseCprGradeNum(a.cprBase),
		apiCprScore: a.cprDecayedScore ?? a.cprScore ?? null
	}));

	const faMarks = getFirstAscentMarks();
	const extraRows = all.map((a) => ({
		ascentDate: a.ascentDate,
		ascentId: a.id,
		routeId: a.routeId,
		firstAscent: firstAscentKindFor(faMarks, a.routeProvider, a.routeExternalId),
		gearStyle: a.gearStyle,
		isSend: a.isSend,
		heightM: a.heightM,
		routeHeightM: a.routeHeightM,
		tickType: a.tickType,
		partners: a.partners,
		quality: a.quality,
		stars: a.stars,
		qualityScore: a.qualityScore,
		gradeScore: a.gradeScore,
		gradeSystem: a.gradeSystem,
		effectiveGradeScore: a.effectiveGradeScore,
		gradeBand: a.gradeBand ?? a.effectiveGradeBand,
		routeName: displayRouteName(a.routeName, a.pitchLabel, a.ascentLabel),
		url: linkFor(a),
		ascentUrl: a.ascentUrl,
		tagsJson: a.tagsJson,
		country: a.country,
		routeIsProject: a.routeIsProject,
		hasPersonalGrade: hasPersonalAscentGrade(a.gradeProvenanceJson)
	}));
	const monthly = buildMonthlyStats(extraRows);
	const yearly = buildYearlyStats(extraRows);
	const milestones = buildMilestones(extraRows);
	const badges = buildBadges(extraRows, setterBadgeHits());
	const trainingLoad = buildTrainingLoadView(extraRows);
	const styleMix = buildStyleMixOverTime(extraRows);
	const partners = buildPartnerLeaderboard(extraRows, 7).partners;
	const starsScatter = buildStarsScatter(extraRows).points;
	const qualityBreakdown = buildQualityBreakdown(extraRows).ratings;
	const routePopularity = buildRoutePopularityStats(
		all.map((a) => {
			const isBoulder = vScale(a);
			const score = effectiveScore(a);
			const raw = effectiveRaw(a);
			return {
				routeId: a.routeId,
				routeName: displayRouteName(a.routeName, a.pitchLabel, a.ascentLabel),
				isSend: a.isSend,
				url: linkFor(a),
				cragName: a.cragName,
				stars: a.stars,
				quality: a.quality,
				qualityScore: a.qualityScore,
				ascentCount: a.ascentCount,
				popularity: a.popularity,
				relativePopularity: a.relativePopularity,
				gradeLabel: score != null ? formatGrade(score, isBoulder, preferredSystem, raw) : raw
			};
		})
	);
	const rockAgg = buildRockTypeStats(extraRows);
	const rockBlurb = rockTypeBlurb(rockAgg.dominant, rockAgg.dominantPct);
	const bestMonths = buildBestMonthsView(
		all.map((a) => ({
			cragName: a.cragName,
			cragUrl: a.cragUrl,
			ascentDate: a.ascentDate,
			routeId: a.routeId,
			seasonalityJson: a.seasonalityJson
		}))
	);

	// Ewbank and V-scale scores aren't comparable, so rank each discipline separately (#58).
	const hardestSends = pickHardestSends(
		all.filter((r) => r.isSend),
		effectiveScore,
		(r) => (vScale(r) ? 'boulder' : 'route')
	).map(({ row: r, discipline }) => {
		const isBoulder = discipline === 'boulder';
		const score = effectiveScore(r);
		const raw = effectiveRaw(r);
		return {
			discipline,
			routeName: displayRouteName(r.routeName, r.pitchLabel, r.ascentLabel),
			gradeRaw: raw,
			gradeLabel: score != null ? formatGrade(score, isBoulder, preferredSystem, raw) : raw,
			// Stored bands can be Ewbank-derived; boulder bands come from the V-score.
			gradeBand:
				isBoulder && score != null
					? (bandFromVScale(score)?.id ?? effectiveBand(r))
					: effectiveBand(r),
			pitchLabel: r.pitchLabel,
			tickType: r.tickType,
			ascentDate: r.ascentDate,
			cragName: r.cragName,
			cragUrl: r.cragUrl,
			url: linkFor(r)
		};
	});

	const recent = [...all]
		.sort((a, b) => (b.ascentDate || '').localeCompare(a.ascentDate || ''))
		.slice(0, 20)
		.map((r) => {
			const isBoulder = vScale(r);
			const score = effectiveScore(r);
			const raw = effectiveRaw(r);
			return {
				id: r.id,
				routeName: displayRouteName(r.routeName, r.pitchLabel, r.ascentLabel),
				gradeRaw: raw,
				gradeLabel: score != null ? formatGrade(score, isBoulder, preferredSystem, raw) : raw,
				gradeBand: effectiveBand(r),
				pitchLabel: r.pitchLabel,
				tickType: r.tickType,
				ascentDate: r.ascentDate,
				cragName: r.cragName,
				cragUrl: r.cragUrl,
				isSend: r.isSend,
				isAttempt: r.isAttempt,
				partners: r.partners,
				quality: r.quality,
				tags: parseTagsJson(r.tagsJson).slice(0, 6),
				url: linkFor(r)
			};
		});

	const outdoorAscents = profile?.outdoorAscentCount ?? null;
	const indoorAscents = profile?.indoorAscentCount ?? null;
	const accountHeightM =
		profile?.heightClimbed != null && Number.isFinite(profile.heightClimbed)
			? Math.round(profile.heightClimbed)
			: null;

	let earliest: string | null = null;
	for (const row of all) {
		const d = validDay(row.ascentDate);
		if (!d) continue;
		if (!earliest || d < earliest) earliest = d;
	}

	return {
		profileName: profile?.name ?? null,
		climberType,
		avatar: resolveTheCragAvatar(profile?.avatar) ?? profile?.avatar ?? null,
		totalAscents: all.length,
		totalSends: sends,
		totalAttempts: attempts,
		onsightCount,
		outdoorAscents,
		indoorAscents,
		routesTicked: profile?.routesTicked ?? routeSet.size,
		heightM: accountHeightM ?? Math.round(heightM),
		heightKm: Math.round(((accountHeightM ?? heightM) / 1000) * 10) / 10,
		distinctRoutes: routeSet.size,
		distinctCrags: cragMap.size,
		preferredSystem,
		heatmap,
		styleShare,
		tickBreakdown: [...tickMap.entries()]
			.map(([tick, count]) => ({ tick, count }))
			.sort((a, b) => b.count - a.count),
		topCrags: [...cragMap.entries()]
			.map(([crag, v]) => ({
				crag,
				count: v.count,
				maxGrade: v.maxGrade,
				maxBand: v.maxBand,
				url: v.url
			}))
			.sort((a, b) => b.count - a.count)
			.slice(0, 12),
		volumeByMonth: [...monthMap.entries()]
			.map(([month, v]) => ({ month, ...v }))
			.sort((a, b) => a.month.localeCompare(b.month))
			.slice(-24),
		stylePyramids,
		stylePyramidsByMode,
		bandBreakdown: GRADE_BANDS.map((b) => ({
			band: b.id,
			name: b.name,
			count: bandMap.get(b.id) ?? 0,
			color: b.color
		})),
		notableByStyle: toNotableRows(notableStyle, 'style').slice(0, 40),
		notableByArea: toNotableRows(notableArea, 'area').slice(0, 40),
		blurb: (() => {
			const base = buildClimberBlurb({
				firstDate: earliest,
				activeDays: dayMap.size,
				totalAscents: all.length,
				totalSends: sends,
				onsightCount,
				flashCount,
				redpointCount,
				pinkpointCount,
				climberType,
				heightM: accountHeightM ?? heightM,
				distinctRoutes: routeSet.size,
				distinctCrags: cragMap.size,
				outdoorAscents,
				indoorAscents
			});
			if (rockBlurb) base.paragraphs.push(rockBlurb);
			return base;
		})(),
		firstAscents: (() => {
			const routesSet = countOwnerSetRoutes();
			if (!faMarks.size) return { ...buildFirstAscentStats([]), routesSet };
			// One row per marked route: route grade (not a pitch), dated by the first send
			// (same as the FA badges and milestones), else the earliest logged ascent.
			const sendDay = new Map(
				firstAscentSends(extraRows).map((s) => [s.row.routeId as number, s.day])
			);
			const byRoute = new Map<number, FirstAscentRow>();
			for (const r of all) {
				const kind = firstAscentKindFor(faMarks, r.routeProvider, r.routeExternalId);
				if (!kind) continue;
				const day = validDay(r.ascentDate);
				const prev = byRoute.get(r.routeId);
				if (prev) {
					if (day && (!prev.date || day < prev.date)) prev.date = day;
					continue;
				}
				const isBoulder = vScale(r);
				const score = r.gradeScore;
				const gradeLabel =
					score == null ? r.gradeRaw : formatGrade(score, isBoulder, preferredSystem, r.gradeRaw);
				byRoute.set(r.routeId, {
					routeId: r.routeId,
					kind,
					routeName: r.routeName,
					style: displayStyle(r.gearStyle),
					isBoulder,
					score,
					gradeLabel,
					band:
						isBoulder && score != null ? (bandFromVScale(score)?.id ?? r.gradeBand) : r.gradeBand,
					cragName: r.cragName,
					url: r.url,
					date: day
				});
			}
			for (const fa of byRoute.values()) fa.date = sendDay.get(fa.routeId) ?? fa.date;
			return { ...buildFirstAscentStats([...byRoute.values()]), routesSet };
		})(),
		solo: buildSoloStats(
			all.map((r) => {
				const isBoulder = vScale(r);
				const score = effectiveScore(r);
				return {
					tickType: r.tickType,
					ascentGearStyle: r.ascentGearStyle,
					isSend: Boolean(r.isSend),
					partners: r.partners,
					date: validDay(r.ascentDate),
					routeName: displayRouteName(r.routeName, r.pitchLabel, r.ascentLabel),
					score,
					isBoulder,
					gradeLabel:
						score != null
							? formatGrade(score, isBoulder, preferredSystem, effectiveRaw(r))
							: effectiveRaw(r),
					band:
						isBoulder && score != null
							? (bandFromVScale(score)?.id ?? effectiveBand(r))
							: effectiveBand(r),
					url: linkFor(r)
				};
			})
		),
		eddington: buildEddington(
			all.map((r) => ({
				day: validDay(r.ascentDate),
				routeId: r.routeId,
				isSend: Boolean(r.isSend),
				heightM: r.heightM ?? r.routeHeightM ?? 0,
				score: effectiveScore(r),
				isBoulder: vScale(r)
			}))
		),
		streaks: buildStreaks(dayMap),
		athleteProfile: buildAthleteProfile(all, dayMap),
		cpr: {
			sport: buildCprTimeline(cprInputs, 'sport'),
			trad: buildCprTimeline(cprInputs, 'trad'),
			boulder: buildCprTimeline(cprInputs, 'boulder')
		},
		hardestSends,
		recent,
		monthly,
		yearly,
		milestones,
		badges,
		trainingLoad,
		styleMix,
		partners,
		starsScatter,
		qualityBreakdown,
		rockTypes: {
			types: rockAgg.types,
			dominant: rockAgg.dominant,
			dominantPct: rockAgg.dominantPct,
			info: rockTypeInfo(rockAgg.dominant)
		},
		pyramidMode,
		routePopularity,
		bestMonths
	};
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export type LogbookFaFilter = 'FA' | 'FFA' | 'any' | 'none';

function parseLogbookFa(v: string | undefined): LogbookFaFilter | undefined {
	if (v === 'FA' || v === 'FFA' || v === 'any' || v === 'none') return v;
	return undefined;
}

/** provider:routeExternalId keys already answered by route-history import. */
function getFetchedRouteKeys(): Set<string> {
	ensureSchema();
	const out = new Set<string>();
	for (const r of db.select().from(routeHistoryFetches).all()) {
		out.add(`${r.provider}:${r.routeExternalId}`);
	}
	return out;
}

function normalizeList(single: string | undefined, many: string[] | undefined): string[] {
	const out: string[] = [];
	if (many?.length) {
		for (const v of many) {
			const t = v.trim();
			if (t) out.push(t);
		}
	} else if (single?.trim()) {
		out.push(single.trim());
	}
	return out;
}

export function listLogbook(filters?: {
	q?: string;
	/** Single style (legacy / deep links); prefer `styles` for multi-select */
	style?: string;
	styles?: string[];
	tick?: string;
	ticks?: string[];
	crag?: string;
	sector?: string;
	/** Exact path beneath the crag, including descendants. */
	sectorPath?: string[];
	year?: number;
	/** Exact YYYY-MM-DD */
	day?: string;
	/** Inclusive YYYY-MM-DD lower bound on ascentDate */
	from?: string;
	/** Inclusive YYYY-MM-DD upper bound on ascentDate */
	to?: string;
	/** Exact effective/route grade score bucket (from pyramid links) */
	score?: number;
	/** Inclusive route (non-boulder) score floor — Ewbank-canonical */
	minScore?: number;
	/** Inclusive route (non-boulder) score ceiling — Ewbank-canonical */
	maxScore?: number;
	/** Grade band id 1–5 */
	band?: number;
	/** Only multipitch ascents (pitch label or pitchesTotal > 1) */
	multipitch?: boolean;
	/** ytd | last_year | or leave empty */
	season?: string;
	/** FA | FFA | any | none — route-level first_ascents mark */
	fa?: string;
	/** pending — route has no route_history_fetches row */
	history?: string;
	/** Exact match on ascents.quality (legacy single) */
	quality?: string;
	qualities?: string[];
	/** routes.stars >= N (1–3) */
	minStars?: number;
	/** Substring on ascents.partners */
	with?: string;
	/** has = non-empty partners; missing = empty/null */
	partners?: 'has' | 'missing';
	/** Route fields that are null/absent: height, bolts */
	missing?: Array<'height' | 'bolts'>;
	/** Case-insensitive substring match on route tag names in tags_json */
	tag?: string;
	partnerMatch?: 'exact' | 'contains';
	/** Route tags_json Rock type name (case-insensitive exact match) */
	rock?: string;
	/** date | grade | quality | stars | style | tick | ascents | popularity */
	sort?: string;
	/** asc | desc */
	order?: string;
	limit?: number;
	offset?: number;
	/** Private ascent notes; only when the viewer may see them (see notes.ts). Default off. */
	includeNotes?: boolean;
}) {
	ensureSchema();
	const limit = filters?.limit ?? 100;
	const offset = filters?.offset ?? 0;
	const faFilter = parseLogbookFa(filters?.fa);
	const historyPending = filters?.history === 'pending';
	// Marks load before filter/page so fa=* can filter and rows still show the chip.
	const faMarks = getFirstAscentMarks();
	const fetchedKeys = historyPending ? getFetchedRouteKeys() : null;
	const styleList = normalizeList(filters?.style, filters?.styles);
	const tickList = normalizeList(filters?.tick, filters?.ticks).map((t) => t.toLowerCase());
	const qualityList = normalizeList(filters?.quality, filters?.qualities);
	const fromBound = filters?.from && ISO_DAY.test(filters.from) ? filters.from : '';
	const toBound = filters?.to && ISO_DAY.test(filters.to) ? filters.to : '';
	// from/to win over year/season so mixed URL params stay predictable (#85).
	const useYearSeason = !fromBound && !toBound;

	let rows = db
		.select({
			id: ascents.id,
			externalId: ascents.externalId,
			routeProvider: routes.provider,
			routeExternalId: routes.externalId,
			ascentDate: ascents.ascentDate,
			tickType: ascents.tickType,
			isSend: ascents.isSend,
			isAttempt: ascents.isAttempt,
			partners: ascents.partners,
			comment: ascents.comment,
			quality: ascents.quality,
			ascentLabel: ascents.ascentLabel,
			pitchLabel: ascents.pitchLabel,
			pitchesTotal: ascents.pitchesTotal,
			numberAttempts: ascents.numberAttempts,
			ascentGearStyle: ascents.ascentGearStyle,
			ascentUrl: ascents.ascentUrl,
			effectiveGradeRaw: ascents.effectiveGradeRaw,
			effectiveGradeScore: ascents.effectiveGradeScore,
			effectiveGradeBand: ascents.effectiveGradeBand,
			routeName: routes.name,
			gradeRaw: routes.gradeRaw,
			gradeBand: routes.gradeBand,
			gradeScore: routes.gradeScore,
			gradeSystem: routes.gradeSystem,
			gearStyle: routes.gearStyle,
			cragName: routes.cragName,
			cragPath: routes.cragPath,
			cragUrl: routes.cragUrl,
			country: routes.country,
			heightM: routes.heightM,
			routeUrl: routes.url,
			stars: routes.stars,
			qualityScore: routes.qualityScore,
			ascentCount: routes.ascentCount,
			popularity: routes.popularity,
			relativePopularity: routes.relativePopularity,
			parentName: routes.parentName,
			bolts: routes.bolts,
			tagsJson: routes.tagsJson,
			ancestorsJson: routes.ancestorsJson
		})
		.from(ascents)
		.innerJoin(routes, eq(ascents.routeId, routes.id))
		.orderBy(desc(ascents.ascentDate))
		.all();

	const routeAscentCounts = buildRouteAscentCounts(rows);

	// Drop notes up front so they can't reach the page or be probed through search.
	if (!filters?.includeNotes) rows = rows.map((r) => ({ ...r, comment: null }));

	if (styleList.length) {
		rows = rows.filter((r) => {
			return styleList.some(
				(s) => matchesClimbStyle(r.ascentGearStyle, s) || matchesClimbStyle(r.gearStyle, s)
			);
		});
	}
	if (tickList.length) {
		rows = rows.filter((r) => tickList.includes((r.tickType || '').toLowerCase()));
	}
	if (filters?.crag) {
		const c = filters.crag.toLowerCase();
		rows = rows.filter((r) => (r.cragName || '').toLowerCase().includes(c));
	}
	if (filters?.sectorPath?.length) {
		const wanted = filters.sectorPath;
		rows = rows.filter((r) => {
			const { segments } = sectorPathUnderCrag({
				ancestorsJson: r.ancestorsJson,
				cragName: r.cragName ?? 'Unknown',
				parentName: r.parentName
			});
			return wanted.every((part, i) => segments[i] === part);
		});
	} else if (filters?.sector) {
		const needle = filters.sector.toLowerCase();
		rows = rows.filter(
			(r) =>
				(r.parentName ?? '').toLowerCase().includes(needle) ||
				ancestorAreaNames(parseAncestorsJson(r.ancestorsJson)).some((name) =>
					name.toLowerCase().includes(needle)
				)
		);
	}
	if (useYearSeason && filters?.year != null && Number.isFinite(filters.year)) {
		const y = String(filters.year);
		rows = rows.filter((r) => (r.ascentDate || '').startsWith(y));
	}
	if (filters?.day && ISO_DAY.test(filters.day)) {
		const day = filters.day;
		rows = rows.filter((r) => (r.ascentDate || '').startsWith(day));
	}
	if (fromBound) {
		const from = fromBound;
		// Undated rows have no evidence they fall after `from` — exclude them.
		rows = rows.filter((r) => {
			const d = (r.ascentDate || '').slice(0, 10);
			return ISO_DAY.test(d) && d >= from;
		});
	}
	if (toBound) {
		const to = toBound;
		// Undated rows have no evidence they fall on/before `to` — exclude them
		// (empty string would otherwise compare as <= any bound).
		rows = rows.filter((r) => {
			const d = (r.ascentDate || '').slice(0, 10);
			return ISO_DAY.test(d) && d <= to;
		});
	}
	if (filters?.score != null && Number.isFinite(filters.score)) {
		const target = Math.round(filters.score);
		rows = rows.filter((r) => {
			const score = r.effectiveGradeScore ?? r.gradeScore;
			return score != null && Math.round(score) === target;
		});
	}
	const minScore =
		filters?.minScore != null && Number.isFinite(filters.minScore) ? filters.minScore : null;
	const maxScore =
		filters?.maxScore != null && Number.isFinite(filters.maxScore) ? filters.maxScore : null;
	if (minScore != null || maxScore != null) {
		rows = rows.filter((r) => {
			// Route grade range only — never mix V-scale boulder scores into Ewbank buckets.
			if (usesVScale(r.gradeSystem, r.gearStyle)) return false;
			const score = r.effectiveGradeScore ?? r.gradeScore;
			if (score == null) return false;
			const n = Math.round(score);
			if (minScore != null && n < minScore) return false;
			if (maxScore != null && n > maxScore) return false;
			return true;
		});
	}
	if (filters?.band != null && Number.isFinite(filters.band)) {
		const b = filters.band;
		rows = rows.filter((r) => (r.effectiveGradeBand ?? r.gradeBand) === b);
	}
	if (filters?.multipitch) {
		rows = rows.filter(
			(r) => Boolean(r.pitchLabel) || (r.pitchesTotal != null && r.pitchesTotal > 1)
		);
	}
	if (useYearSeason && filters?.season === 'ytd') {
		const y = new Date().getUTCFullYear();
		rows = rows.filter((r) => (r.ascentDate || '').startsWith(String(y)));
	} else if (useYearSeason && filters?.season === 'last_year') {
		const y = new Date().getUTCFullYear() - 1;
		rows = rows.filter((r) => (r.ascentDate || '').startsWith(String(y)));
	}
	if (qualityList.length) {
		rows = rows.filter((r) => qualityList.includes(r.quality || ''));
	}
	if (filters?.minStars != null && Number.isFinite(filters.minStars) && filters.minStars >= 1) {
		const min = filters.minStars;
		rows = rows.filter((r) => r.stars != null && r.stars >= min);
	}
	if (filters?.with) {
		const w = filters.with.toLowerCase();
		rows = rows.filter((r) =>
			filters.partnerMatch === 'exact'
				? splitPartners(r.partners).some((partner) => partner.toLowerCase() === w)
				: (r.partners || '').toLowerCase().includes(w)
		);
	}
	if (filters?.rock) {
		const rock = filters.rock.trim().toLowerCase();
		if (rock) {
			rows = rows.filter((r) =>
				parseTagsJson(r.tagsJson).some(
					(t) =>
						t.category.trim().toLowerCase() === 'rock type' && t.name.trim().toLowerCase() === rock
				)
			);
		}
	}
	if (filters?.partners === 'has') {
		rows = rows.filter((r) => Boolean((r.partners || '').trim()));
	} else if (filters?.partners === 'missing') {
		rows = rows.filter((r) => !(r.partners || '').trim());
	}
	if (filters?.missing?.includes('height')) {
		rows = rows.filter((r) => r.heightM == null);
	}
	if (filters?.missing?.includes('bolts')) {
		rows = rows.filter((r) => r.bolts == null);
	}
	if (filters?.tag?.trim()) {
		const needle = filters.tag.trim().toLowerCase();
		rows = rows.filter((r) =>
			parseTagsJson(r.tagsJson).some((t) => t.name.toLowerCase().includes(needle))
		);
	}
	if (faFilter) {
		rows = rows.filter((r) => {
			const kind = firstAscentKindFor(faMarks, r.routeProvider, r.routeExternalId);
			if (faFilter === 'none') return kind == null;
			if (faFilter === 'any') return kind != null;
			return kind === faFilter;
		});
	}
	if (fetchedKeys) {
		rows = rows.filter((r) => !fetchedKeys.has(`${r.routeProvider}:${r.routeExternalId}`));
	}
	if (filters?.q) {
		const q = filters.q.toLowerCase();
		rows = rows.filter(
			(r) =>
				r.routeName.toLowerCase().includes(q) ||
				(r.ascentLabel || '').toLowerCase().includes(q) ||
				(r.cragName || '').toLowerCase().includes(q) ||
				(r.parentName || '').toLowerCase().includes(q) ||
				(r.partners || '').toLowerCase().includes(q) ||
				(r.comment || '').toLowerCase().includes(q)
		);
	}

	const sortKey = parseLogbookSortKey(filters?.sort);
	const asc = (filters?.order || 'desc').toLowerCase() === 'asc';
	rows = sortLogbookRows(rows, sortKey, asc, routeAscentCounts);

	const total = rows.length;
	return {
		total,
		rows: rows.slice(offset, offset + limit).map((r) => ({
			...r,
			firstAscent: firstAscentKindFor(faMarks, r.routeProvider, r.routeExternalId),
			displayName: displayRouteName(r.routeName, r.pitchLabel, r.ascentLabel),
			gradeBand: r.effectiveGradeBand ?? r.gradeBand,
			gradeRaw: r.effectiveGradeRaw ?? r.gradeRaw,
			tags: parseTagsJson(r.tagsJson),
			url: r.ascentUrl || theCragAscentUrl(r.externalId) || r.routeUrl,
			myAscentsOnRoute: routeAscentCounts.get(routeKey(r.routeProvider, r.routeExternalId)) ?? 1,
			routePopularity: routePopularity(r)
		}))
	};
}

export function wipeAllData() {
	ensureSchema();
	// Abandon any in-flight route-history import before clearing tables (#74).
	invalidateRouteHistoryRuns();
	db.run(sql`DELETE FROM projects`);
	db.run(sql`DELETE FROM goals`);
	db.run(sql`DELETE FROM first_ascents`);
	db.run(sql`DELETE FROM first_ascent_import_skips`);
	db.run(sql`DELETE FROM route_history`);
	db.run(sql`DELETE FROM route_history_fetches`);
	db.run(sql`DELETE FROM route_history_import_state`);
	db.run(sql`DELETE FROM ascents`);
	db.run(sql`DELETE FROM routes`);
	db.run(sql`DELETE FROM profiles`);
	db.run(sql`DELETE FROM sync_state`);
}

function formatDurationHuman(fromIso: string, to = new Date()): string {
	const from = new Date(`${fromIso}T12:00:00`);
	if (Number.isNaN(from.getTime())) return 'a while';
	let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
	if (to.getDate() < from.getDate()) months -= 1;
	months = Math.max(0, months);
	const years = Math.floor(months / 12);
	const rem = months % 12;
	if (years <= 0) return rem <= 1 ? `${Math.max(1, rem)} month` : `${rem} months`;
	if (rem === 0) return years === 1 ? '1 year' : `${years} years`;
	return `${years} year${years === 1 ? '' : 's'} and ${rem} month${rem === 1 ? '' : 's'}`;
}

/** First-go vs worked-route preference from tick mix (used in the climbing story). */
export function describeSendPreference(input: {
	onsightCount: number;
	flashCount: number;
	redpointCount: number;
	pinkpointCount: number;
	totalSends: number;
}): string {
	const firstGo = input.onsightCount + input.flashCount;
	const worked = input.redpointCount + input.pinkpointCount;
	const classified = firstGo + worked;
	if (classified === 0) return 'I mix onsighting with redpointing and working routes';
	const firstGoShare = firstGo / classified;
	const workedShare = worked / classified;
	// Need a clear majority; a near split reads as mixed style.
	if (firstGoShare >= 0.55) return 'I like to onsight (and flash) when I can';
	if (workedShare >= 0.55) return 'I tend to work routes and redpoint them';
	return 'I mix onsighting with redpointing and working routes';
}

function climberTypeSentence(climberType: string, preference: string): string {
	const type = (climberType || 'Rock climber').trim() || 'Rock climber';
	const labeled = /climber$/i.test(type) ? type : `${type} climber`;
	return `I'm a ${labeled} — ${preference}.`;
}

function buildClimberBlurb(input: {
	firstDate: string | null;
	activeDays: number;
	totalAscents: number;
	totalSends: number;
	onsightCount: number;
	flashCount: number;
	redpointCount: number;
	pinkpointCount: number;
	climberType: string;
	heightM: number;
	distinctRoutes: number;
	distinctCrags: number;
	outdoorAscents: number | null;
	indoorAscents: number | null;
}): {
	startedOn: string | null;
	durationLabel: string | null;
	paragraphs: string[];
} {
	const heightM = Math.round(input.heightM);
	const heightKm = Math.round((heightM / 1000) * 10) / 10;
	const everest = heightM > 0 ? Math.round((heightM / 8849) * 10) / 10 : 0;
	const elCap = heightM > 0 ? Math.round((heightM / 900) * 10) / 10 : 0;
	const worldLaps = heightKm > 0 ? Math.round((heightKm / 40075) * 100) / 100 : 0;
	const perDay =
		input.activeDays > 0 ? Math.round((input.totalAscents / input.activeDays) * 10) / 10 : 0;
	const identity = climberTypeSentence(
		input.climberType,
		describeSendPreference({
			onsightCount: input.onsightCount,
			flashCount: input.flashCount,
			redpointCount: input.redpointCount,
			pinkpointCount: input.pinkpointCount,
			totalSends: input.totalSends
		})
	);

	if (!input.firstDate) {
		return {
			startedOn: null,
			durationLabel: null,
			paragraphs: [
				`You've logged ${input.totalAscents} ascents across ${input.distinctCrags} crags so far.`,
				identity
			]
		};
	}

	const duration = formatDurationHuman(input.firstDate);
	const outdoorBit =
		input.outdoorAscents != null
			? ` ${input.outdoorAscents} outdoor` +
				(input.indoorAscents != null ? ` / ${input.indoorAscents} indoor` : '')
			: '';

	const paragraphs = [
		`Since I began climbing ${duration} ago on ${input.firstDate}, I've logged ${input.activeDays} active days at the crag.`,
		`In that time I've racked up ${input.totalAscents} logged ascents (${input.totalSends} sends, ${input.onsightCount} onsights)${outdoorBit}, on ${input.distinctRoutes} routes across ${input.distinctCrags} areas.`,
		heightM > 0
			? `That's about ${heightKm} km of rock — roughly ${everest}× Everest or ${elCap}× El Capitan${worldLaps > 0 ? `, and ${worldLaps} trips around the world if you laid the rope end-to-end` : ''}.`
			: null,
		`On average that's ${perDay} ascents per active day.`,
		identity
	].filter((p): p is string => Boolean(p));

	return { startedOn: input.firstDate, durationLabel: duration, paragraphs };
}

function buildStreaks(dayMap: Map<string, { count: number; sends: number }>): {
	currentDays: number;
	currentWeeks: number;
	currentMonths: number;
	longestDays: number;
	lastActiveDate: string | null;
} {
	const days = [...dayMap.keys()].sort();
	if (!days.length) {
		return {
			currentDays: 0,
			currentWeeks: 0,
			currentMonths: 0,
			longestDays: 0,
			lastActiveDate: null
		};
	}

	const daySet = new Set(days);
	let longest = 1;
	let run = 1;
	for (let i = 1; i < days.length; i++) {
		const prev = new Date(`${days[i - 1]}T12:00:00`);
		const cur = new Date(`${days[i]}T12:00:00`);
		const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
		if (diff === 1) {
			run += 1;
			longest = Math.max(longest, run);
		} else {
			run = 1;
		}
	}

	const last = days[days.length - 1];
	const today = new Date();
	const todayIso = today.toISOString().slice(0, 10);
	const yesterday = new Date(today);
	yesterday.setDate(yesterday.getDate() - 1);
	const yIso = yesterday.toISOString().slice(0, 10);

	let currentDays = 0;
	if (daySet.has(todayIso) || daySet.has(yIso)) {
		const cursor = daySet.has(todayIso)
			? new Date(`${todayIso}T12:00:00`)
			: new Date(`${yIso}T12:00:00`);
		let guard = 0;
		while (daySet.has(cursor.toISOString().slice(0, 10)) && guard < 4000) {
			currentDays += 1;
			guard += 1;
			cursor.setDate(cursor.getDate() - 1);
		}
	}

	const weekKey = (iso: string): string | null => {
		const d = new Date(`${iso}T12:00:00`);
		if (Number.isNaN(d.getTime())) return null;
		const tmp = new Date(d);
		tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
		const week1 = new Date(tmp.getFullYear(), 0, 4);
		const week =
			1 +
			Math.round(
				((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
			);
		if (!Number.isFinite(week) || week < 1 || week > 53) return null;
		return `${tmp.getFullYear()}-W${String(week).padStart(2, '0')}`;
	};
	const weeks = [...new Set(days.map(weekKey).filter((k): k is string => Boolean(k)))].sort();
	let currentWeeks = 0;
	if (weeks.length) {
		const lastWeek = weeks[weeks.length - 1];
		const weekSet = new Set(weeks);
		const [yStr, wStr] = lastWeek.split('-W');
		let y = Number(yStr);
		let w = Number(wStr);
		let guard = 0;
		while (
			Number.isFinite(y) &&
			Number.isFinite(w) &&
			weekSet.has(`${y}-W${String(w).padStart(2, '0')}`) &&
			guard < 3000
		) {
			currentWeeks += 1;
			guard += 1;
			w -= 1;
			if (w < 1) {
				y -= 1;
				w = 52;
			}
		}
	}

	const months = [...new Set(days.map((d) => d.slice(0, 7)))].sort();
	let currentMonths = 0;
	if (months.length) {
		const monthSet = new Set(months);
		let [y, m] = months[months.length - 1].split('-').map(Number);
		let guard = 0;
		while (
			Number.isFinite(y) &&
			Number.isFinite(m) &&
			monthSet.has(`${y}-${String(m).padStart(2, '0')}`) &&
			guard < 600
		) {
			currentMonths += 1;
			guard += 1;
			m -= 1;
			if (m < 1) {
				y -= 1;
				m = 12;
			}
		}
	}

	return {
		currentDays,
		currentWeeks,
		currentMonths,
		longestDays: longest,
		lastActiveDate: last
	};
}

function buildAthleteProfile(
	all: {
		ascentDate: string | null;
		isSend: boolean;
		tickType: string | null;
		gearStyle: string | null;
		heightM: number | null;
		routeHeightM: number | null;
		effectiveGradeScore: number | null;
		gradeScore: number | null;
	}[],
	dayMap: Map<string, { count: number; sends: number }>
): {
	axes: { key: string; label: string; last30: number; last90: number }[];
} {
	const scoreAxes = (sinceDays: number) => {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - sinceDays);
		const cutIso = cutoff.toISOString().slice(0, 10);
		const rows = all.filter((r) => (r.ascentDate || '') >= cutIso);
		const days = new Set(
			rows
				.map((r) => (r.ascentDate || '').slice(0, 10))
				.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
		);
		const styles = new Set(rows.map((r) => displayStyle(r.gearStyle)));
		const sends = rows.filter((r) => r.isSend).length;
		const onsights = rows.filter((r) => (r.tickType || '').toLowerCase().includes('sight')).length;
		const height = rows.reduce((s, r) => s + (r.heightM ?? r.routeHeightM ?? 0), 0);
		const scores = rows
			.map((r) => r.effectiveGradeScore ?? r.gradeScore)
			.filter((n): n is number => n != null);
		const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
		const maxScore = scores.length ? Math.max(...scores) : 0;

		const volume = Math.min(100, (rows.length / Math.max(1, sinceDays * 0.35)) * 100);
		const variety = Math.min(100, (styles.size / 4) * 100);
		const density = Math.min(100, (days.size / Math.max(1, sinceDays * 0.4)) * 100);
		const duration = Math.min(100, (height / Math.max(1, sinceDays * 25)) * 100);
		const intensity = Math.min(100, ((avgScore + maxScore) / 2 / 30) * 100);
		const consistency = Math.min(100, (sends / Math.max(1, rows.length)) * 100);
		const ambition = Math.min(100, (onsights / Math.max(1, rows.length)) * 120);

		return {
			volume,
			variety,
			density,
			duration,
			intensity,
			consistency: (consistency + ambition) / 2
		};
	};

	const a30 = scoreAxes(30);
	const a90 = scoreAxes(90);
	void dayMap;

	return {
		axes: [
			{ key: 'volume', label: 'Volume', last30: a30.volume, last90: a90.volume },
			{ key: 'variety', label: 'Style variety', last30: a30.variety, last90: a90.variety },
			{ key: 'density', label: 'Density', last30: a30.density, last90: a90.density },
			{ key: 'duration', label: 'Height', last30: a30.duration, last90: a90.duration },
			{ key: 'intensity', label: 'Intensity', last30: a30.intensity, last90: a90.intensity },
			{ key: 'consistency', label: 'Consistency', last30: a30.consistency, last90: a90.consistency }
		].map((a) => ({
			...a,
			last30: Math.round(a.last30),
			last90: Math.round(a.last90)
		}))
	};
}
