/**
 * Pure dashboard aggregations for Phase 2–3 widgets.
 * Accept typed row arrays — no SQLite / better-sqlite3 imports.
 */
import { formatVScaleLabel, usesVScale } from '#lib/grades';
import { tickKind } from '#lib/ticks';

/** Minimal row shape shared by extras builders. */
export type DashboardExtraRow = {
	ascentDate: string | null;
	/** Stable id for same-day ordering (badges / milestones). */
	ascentId?: number | null;
	gearStyle?: string | null;
	isSend?: boolean | null;
	heightM?: number | null;
	routeHeightM?: number | null;
	tickType?: string | null;
	partners?: string | null;
	quality?: string | null;
	stars?: number | null;
	gradeScore?: number | null;
	/** Route grade system (ewbank, v_scale, …): decides whether scores are V-scale (#72) */
	gradeSystem?: string | null;
	effectiveGradeScore?: number | null;
	gradeBand?: number | null;
	routeName?: string | null;
	url?: string | null;
	ascentUrl?: string | null;
	tagsJson?: string | null;
	country?: string | null;
	routeId?: number | null;
	/** theCrag Project flag on the route (route info import, #77). */
	routeIsProject?: number | null;
	/** Explicit personal grade in provider/CSV data, not the effective route fallback. */
	hasPersonalGrade?: boolean;
	/** Owner-marked first ascent of this route (firstAscents.ts) */
	firstAscent?: 'FA' | 'FFA' | null;
};

/**
 * The first logged send of each route marked FA/FFA, in date order: that send dates the
 * first ascent for badges, milestones and the First ascents card.
 */
export function firstAscentSends(
	rows: DashboardExtraRow[]
): { row: DashboardExtraRow; day: string; kind: 'FA' | 'FFA' }[] {
	const sorted = rows
		.filter((r) => r.isSend && r.firstAscent && r.routeId != null && dayKey(r.ascentDate))
		.sort(
			(a, b) =>
				(a.ascentDate || '').localeCompare(b.ascentDate || '') ||
				(a.ascentId ?? 0) - (b.ascentId ?? 0)
		);
	const seen = new Set<number>();
	const out: { row: DashboardExtraRow; day: string; kind: 'FA' | 'FFA' }[] = [];
	for (const row of sorted) {
		if (seen.has(row.routeId!)) continue;
		seen.add(row.routeId!);
		out.push({ row, day: dayKey(row.ascentDate)!, kind: row.firstAscent! });
	}
	return out;
}

export type MonthlyStat = {
	month: string;
	byStyle: Record<string, number>;
	ascents: number;
	sends: number;
	heightM: number;
};

export type YearlyStat = {
	year: number;
	ascents: number;
	sends: number;
	onsights: number;
	heightM: number;
	deltaAscents: number | null;
	deltaHeightM: number | null;
	deltaOnsights: number | null;
};

export type MilestoneItem = {
	kind: 'grade' | 'count' | 'height' | 'fa';
	label: string;
	date: string | null;
	detail: string;
};

export type LoadWindow = {
	ascents: number;
	sends: number;
	activeDays: number;
	heightM: number;
};

export type StyleMixMonth = {
	month: string;
	Sport: number;
	Trad: number;
	Boulder: number;
	Other: number;
};

const COUNT_LANDMARKS = [100, 250, 500, 750, 1000] as const;
const HEIGHT_LANDMARKS_M = [5000, 10000, 20000] as const;
const MAX_GRADE_BREAKTHROUGHS = 8;

/** Boulder / Sport / Trad / Top rope / Other — for monthly by-style bars. */
export function displayStyle(gearStyle: string | null | undefined): string {
	const s = (gearStyle || '').trim().toLowerCase();
	if (!s) return 'Other';
	if (s.includes('boulder')) return 'Boulder';
	if (s.includes('trad')) return 'Trad';
	if (s.includes('sport')) return 'Sport';
	if (s.includes('top')) return 'Top rope';
	return 'Other';
}

/** Sport / Trad / Boulder / Other — for stacked style-mix charts. */
function mixStyle(gearStyle: string | null | undefined): keyof Omit<StyleMixMonth, 'month'> {
	const s = displayStyle(gearStyle);
	if (s === 'Sport' || s === 'Trad' || s === 'Boulder') return s;
	return 'Other';
}

function monthKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const m = iso.slice(0, 7);
	return /^\d{4}-\d{2}$/.test(m) ? m : null;
}

function yearOf(iso: string | null | undefined): number | null {
	const m = monthKey(iso);
	if (!m) return null;
	const y = Number(m.slice(0, 4));
	return Number.isFinite(y) ? y : null;
}

function dayKey(iso: string | null | undefined): string | null {
	if (!iso) return null;
	const d = iso.slice(0, 10);
	return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function heightOf(row: DashboardExtraRow): number {
	const h = row.heightM ?? row.routeHeightM ?? 0;
	return Number.isFinite(h) && h > 0 ? h : 0;
}

function scoreOf(row: DashboardExtraRow): number | null {
	const s = row.effectiveGradeScore ?? row.gradeScore;
	return s != null && Number.isFinite(s) ? s : null;
}

/** V-scale score (boulders, V-graded DWS/highballs), from the grade system first (#72). */
function isVScaleRow(row: DashboardExtraRow): boolean {
	return usesVScale(row.gradeSystem, row.gearStyle);
}

function linkOf(row: DashboardExtraRow): string | null {
	return row.ascentUrl || row.url || null;
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

/** Split partner strings; strip leading @ from handles. */
export function splitPartners(raw: string | null | undefined): string[] {
	if (!raw) return [];
	return raw
		.split(/[,;&/]+|\band\b/i)
		.map((p) => p.trim().replace(/^@+/, '').trim())
		.filter(Boolean);
}

function emptyWindow(): LoadWindow {
	return { ascents: 0, sends: 0, activeDays: 0, heightM: 0 };
}

function sendRate(w: LoadWindow): number {
	if (w.ascents <= 0) return 0;
	return Math.round((w.sends / w.ascents) * 1000) / 10;
}

function addDaysIso(iso: string, delta: number): string {
	const d = new Date(`${iso}T12:00:00Z`);
	d.setUTCDate(d.getUTCDate() + delta);
	return d.toISOString().slice(0, 10);
}

function daysInclusive(from: string, to: string): number {
	const a = new Date(`${from}T12:00:00Z`).getTime();
	const b = new Date(`${to}T12:00:00Z`).getTime();
	if (Number.isNaN(a) || Number.isNaN(b) || b < a) return 0;
	return Math.floor((b - a) / 86400000) + 1;
}

export function buildMonthlyStats(rows: DashboardExtraRow[]): {
	months: MonthlyStat[];
	years: number[];
} {
	const map = new Map<string, MonthlyStat>();
	for (const row of rows) {
		const month = monthKey(row.ascentDate);
		if (!month) continue;
		const slot = map.get(month) ?? {
			month,
			byStyle: {},
			ascents: 0,
			sends: 0,
			heightM: 0
		};
		const style = displayStyle(row.gearStyle);
		slot.byStyle[style] = (slot.byStyle[style] ?? 0) + 1;
		slot.ascents += 1;
		if (row.isSend) slot.sends += 1;
		slot.heightM += heightOf(row);
		map.set(month, slot);
	}
	const months = [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
	const yearSet = new Set(months.map((m) => Number(m.month.slice(0, 4))));
	const years = [...yearSet].filter((y) => Number.isFinite(y)).sort((a, b) => a - b);
	return { months, years };
}

export function buildYearlyStats(rows: DashboardExtraRow[]): { years: YearlyStat[] } {
	const map = new Map<
		number,
		{ year: number; ascents: number; sends: number; onsights: number; heightM: number }
	>();
	for (const row of rows) {
		const year = yearOf(row.ascentDate);
		if (year == null) continue;
		const slot = map.get(year) ?? {
			year,
			ascents: 0,
			sends: 0,
			onsights: 0,
			heightM: 0
		};
		slot.ascents += 1;
		if (row.isSend) slot.sends += 1;
		if (tickKind(row.tickType) === 'onsight') slot.onsights += 1;
		slot.heightM += heightOf(row);
		map.set(year, slot);
	}
	const ordered = [...map.values()].sort((a, b) => a.year - b.year);
	const years: YearlyStat[] = ordered.map((y, i) => {
		const prev = i > 0 ? ordered[i - 1] : null;
		return {
			...y,
			deltaAscents: prev ? y.ascents - prev.ascents : null,
			deltaHeightM: prev ? y.heightM - prev.heightM : null,
			deltaOnsights: prev ? y.onsights - prev.onsights : null
		};
	});
	return { years };
}

export function buildMilestones(rows: DashboardExtraRow[]): { items: MilestoneItem[] } {
	const dated = [...rows]
		.filter((r) => dayKey(r.ascentDate))
		.sort((a, b) => (a.ascentDate || '').localeCompare(b.ascentDate || ''));

	const items: MilestoneItem[] = [];

	// Grade breakthroughs (sends only): first time a new integer score is reached.
	const seenInt = new Set<string>();
	const gradeItems: MilestoneItem[] = [];
	for (const row of dated) {
		if (!row.isSend) continue;
		const score = scoreOf(row);
		if (score == null) continue;
		const n = Math.round(score);
		const boulder = isVScaleRow(row);
		const key = `${boulder ? 'V' : 'E'}:${n}`;
		if (seenInt.has(key)) continue;
		// Only count as breakthrough if it's a new personal high for that system.
		const highs = [...seenInt]
			.filter((k) => k.startsWith(boulder ? 'V:' : 'E:'))
			.map((k) => Number(k.slice(2)));
		const prevMax = highs.length ? Math.max(...highs) : -Infinity;
		seenInt.add(key);
		if (n <= prevMax) continue;
		const label = boulder ? formatVScaleLabel(n) : String(n);
		const name = (row.routeName || 'Unknown').trim() || 'Unknown';
		gradeItems.push({
			kind: 'grade',
			label: `First ${label}`,
			date: dayKey(row.ascentDate),
			detail: name
		});
	}
	items.push(...gradeItems.slice(-MAX_GRADE_BREAKTHROUGHS));

	// Count landmarks (all ascents in chronological order).
	let count = 0;
	const hitCounts = new Set<number>();
	for (const row of dated) {
		count += 1;
		for (const mark of COUNT_LANDMARKS) {
			if (count === mark && !hitCounts.has(mark)) {
				hitCounts.add(mark);
				items.push({
					kind: 'count',
					label: `${mark.toLocaleString('en-US')} ascents`,
					date: dayKey(row.ascentDate),
					detail: `Ascent #${mark}`
				});
			}
		}
	}

	// Height landmarks (cumulative metres).
	let cumH = 0;
	const hitHeight = new Set<number>();
	for (const row of dated) {
		cumH += heightOf(row);
		for (const mark of HEIGHT_LANDMARKS_M) {
			if (cumH >= mark && !hitHeight.has(mark)) {
				hitHeight.add(mark);
				const km = mark / 1000;
				items.push({
					kind: 'height',
					label: `${km} km climbed`,
					date: dayKey(row.ascentDate),
					detail: `Cumulative height reached ${km} km`
				});
			}
		}
	}

	// Owner-marked first ascents, dated by the first send of the route.
	for (const fa of firstAscentSends(rows)) {
		items.push({
			kind: 'fa',
			label: fa.kind === 'FFA' ? 'First free ascent' : 'First ascent',
			date: fa.day,
			detail: (fa.row.routeName || 'Unknown').trim() || 'Unknown'
		});
	}

	items.sort((a, b) => {
		const da = a.date || '';
		const db = b.date || '';
		if (da !== db) return db.localeCompare(da);
		return a.label.localeCompare(b.label);
	});

	return { items };
}

export function buildTrainingLoad(
	rows: DashboardExtraRow[],
	todayIso?: string
): {
	last7: LoadWindow;
	last28: LoadWindow;
	sendRate7: number;
	sendRate28: number;
	restDays7: number;
	restDays28: number;
} {
	const today = (todayIso || new Date().toISOString()).slice(0, 10);
	const start7 = addDaysIso(today, -6);
	const start28 = addDaysIso(today, -27);

	const last7 = emptyWindow();
	const last28 = emptyWindow();
	const days7 = new Set<string>();
	const days28 = new Set<string>();

	for (const row of rows) {
		const day = dayKey(row.ascentDate);
		if (!day || day > today) continue;
		const in7 = day >= start7;
		const in28 = day >= start28;
		if (!in28) continue;
		const h = heightOf(row);
		if (in28) {
			last28.ascents += 1;
			if (row.isSend) last28.sends += 1;
			last28.heightM += h;
			days28.add(day);
		}
		if (in7) {
			last7.ascents += 1;
			if (row.isSend) last7.sends += 1;
			last7.heightM += h;
			days7.add(day);
		}
	}

	last7.activeDays = days7.size;
	last28.activeDays = days28.size;

	const span7 = daysInclusive(start7, today);
	const span28 = daysInclusive(start28, today);

	return {
		last7,
		last28,
		sendRate7: sendRate(last7),
		sendRate28: sendRate(last28),
		restDays7: Math.max(0, span7 - last7.activeDays),
		restDays28: Math.max(0, span28 - last28.activeDays)
	};
}

export function buildStyleMixOverTime(rows: DashboardExtraRow[]): { months: StyleMixMonth[] } {
	const map = new Map<string, StyleMixMonth>();
	for (const row of rows) {
		const month = monthKey(row.ascentDate);
		if (!month) continue;
		const slot = map.get(month) ?? {
			month,
			Sport: 0,
			Trad: 0,
			Boulder: 0,
			Other: 0
		};
		slot[mixStyle(row.gearStyle)] += 1;
		map.set(month, slot);
	}
	const months = [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
	return { months };
}

export function buildPartnerLeaderboard(rows: DashboardExtraRow[]): {
	partners: { name: string; count: number }[];
} {
	const counts = new Map<string, { name: string; count: number }>();
	for (const row of rows) {
		for (const name of splitPartners(row.partners)) {
			const key = name.toLowerCase();
			const prev = counts.get(key);
			if (prev) prev.count += 1;
			else counts.set(key, { name, count: 1 });
		}
	}
	const partners = [...counts.values()]
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
		.slice(0, 15);
	return { partners };
}

export type StarsScatterPoint = {
	stars: number;
	score: number;
	/** Boulder scores are V-grades and route scores Ewbanks, so they never share an axis. */
	kind: 'route' | 'boulder';
	routeName: string;
	url: string | null;
};

export function buildStarsScatter(rows: DashboardExtraRow[]): { points: StarsScatterPoint[] } {
	const points: StarsScatterPoint[] = [];
	for (const row of rows) {
		if (!row.isSend) continue;
		const stars = row.stars;
		const score = scoreOf(row);
		if (stars == null || !Number.isFinite(stars) || score == null) continue;
		points.push({
			stars,
			score,
			kind: isVScaleRow(row) ? 'boulder' : 'route',
			routeName: (row.routeName || 'Unknown').trim() || 'Unknown',
			url: linkOf(row)
		});
	}
	return { points };
}

export function buildQualityBreakdown(rows: DashboardExtraRow[]): {
	ratings: { quality: string; count: number }[];
} {
	const map = new Map<string, number>();
	for (const row of rows) {
		const q = (row.quality || '').trim();
		if (!q) continue;
		map.set(q, (map.get(q) ?? 0) + 1);
	}
	const ratings = [...map.entries()]
		.map(([quality, count]) => ({ quality, count }))
		.sort((a, b) => b.count - a.count || a.quality.localeCompare(b.quality));
	return { ratings };
}

export function buildRockTypeStats(rows: DashboardExtraRow[]): {
	types: { name: string; count: number; pct: number }[];
	dominant: string | null;
	dominantPct: number | null;
} {
	const map = new Map<string, number>();
	for (const row of rows) {
		const tags = parseTagsJson(row.tagsJson);
		const rock = tags.find((t) => t.category.trim().toLowerCase() === 'rock type');
		if (!rock?.name?.trim()) continue;
		const name = rock.name.trim();
		map.set(name, (map.get(name) ?? 0) + 1);
	}
	const total = [...map.values()].reduce((s, n) => s + n, 0);
	const types = [...map.entries()]
		.map(([name, count]) => ({
			name,
			count,
			pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0
		}))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	const top = types[0];
	return {
		types,
		dominant: top?.name ?? null,
		dominantPct: top?.pct ?? null
	};
}
