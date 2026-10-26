/**
 * Approximate Climber Performance Rating inspired by theCrag CPR.
 * https://www.thecrag.com/en/article/cpr
 * https://www.thecrag.com/en/article/cprtimeline
 *
 * Not a byte-for-byte clone of theCrag's proprietary implementation — same ideas:
 * power factor P=5, tick shifts, ~0.7 grade/year decay, best tick per route, per style.
 */

export type CprStyle = 'sport' | 'trad' | 'boulder';

export type CprAscentInput = {
	routeId: number;
	ascentDate: string | null;
	tickType: string | null;
	gradeScore: number | null;
	gearStyle: string | null;
	isSend: boolean;
	isAttempt: boolean;
};

const P = 5;
const DECAY_PER_YEAR = 0.7;

/** Tick shifts relative to redpoint/send baseline (Ewbank / V grades). */
const SPORT_SHIFT: Record<string, number> = {
	onsight: 2.1,
	flash: 1.4,
	'red point': 0,
	redpoint: 0,
	'pink point': -0.5,
	pinkpoint: 0.5,
	tick: -0.3,
	clean: -0.3,
	send: -0.2,
	second: -1.2,
	'top rope': -1.5,
	attempt: -3,
	'hang dog': -2.5,
	hangdog: -2.5,
	working: -3
};

const TRAD_SHIFT: Record<string, number> = {
	...SPORT_SHIFT,
	'pink point': -0.8,
	pinkpoint: -0.8,
	'free solo': 0.5,
	'solo': 0.3
};

const BOULDER_SHIFT: Record<string, number> = {
	onsight: 1.5,
	flash: 0.8,
	send: 0,
	tick: 0,
	clean: 0,
	dab: -0.5,
	attempt: -2,
	working: -2
};

export function normalizeClimbStyle(gearStyle: string | null | undefined): CprStyle | 'other' {
	const s = (gearStyle || '').toLowerCase();
	if (s.includes('boulder')) return 'boulder';
	if (s.includes('trad') || s.includes('alpine') || s.includes('aid')) return 'trad';
	if (s.includes('sport')) return 'sport';
	if (s.includes('top')) return 'other';
	return 'other';
}

function tickShift(style: CprStyle, tickType: string | null | undefined): number {
	const key = (tickType || '').trim().toLowerCase();
	const table = style === 'boulder' ? BOULDER_SHIFT : style === 'trad' ? TRAD_SHIFT : SPORT_SHIFT;
	if (key in table) return table[key];
	if (key.includes('sight')) return table.onsight ?? 2;
	if (key.includes('flash')) return table.flash ?? 1;
	if (key.includes('pink')) return table['pink point'] ?? -0.5;
	if (key.includes('red')) return 0;
	if (key.includes('hang') || key.includes('attempt')) return -2.5;
	return -0.5;
}

function yearsBetween(fromIso: string, to: Date): number {
	const from = new Date(fromIso);
	if (Number.isNaN(from.getTime())) return 0;
	return Math.max(0, (to.getTime() - from.getTime()) / (365.25 * 24 * 3600 * 1000));
}

type BestTick = {
	routeId: number;
	date: string;
	shifted: number;
	tickType: string | null;
	gradeScore: number;
};

function bestTicksByRoute(inputs: CprAscentInput[], style: CprStyle): BestTick[] {
	const best = new Map<number, BestTick>();
	for (const a of inputs) {
		if (normalizeClimbStyle(a.gearStyle) !== style) continue;
		if (a.gradeScore == null || !a.ascentDate) continue;
		// Attempts still contribute weakly (grey tops) via large negative shift
		const shift = tickShift(style, a.tickType);
		const shifted = a.gradeScore + shift;
		const prev = best.get(a.routeId);
		if (!prev || shifted > prev.shifted) {
			best.set(a.routeId, {
				routeId: a.routeId,
				date: a.ascentDate,
				shifted,
				tickType: a.tickType,
				gradeScore: a.gradeScore
			});
		}
	}
	return [...best.values()];
}

/** Effective CPR grade at a point in time (maps onto grade axis). */
export function cprGradeAt(best: BestTick[], at: Date): number | null {
	if (best.length === 0) return null;
	let sum = 0;
	for (const t of best) {
		if (new Date(t.date) > at) continue;
		const decayed = t.shifted - DECAY_PER_YEAR * yearsBetween(t.date, at);
		sum += Math.pow(P, decayed);
	}
	if (sum <= 0) return null;
	return Math.log(sum) / Math.log(P);
}

export function cprScoreLabel(grade: number | null): number | null {
	if (grade == null) return null;
	return Math.round(grade * 100);
}

export type TimelineBucket = {
	/** Period start ISO date (month or quarter) */
	period: string;
	label: string;
	volume: number;
	/** Per tick-family grade ranges for candlesticks */
	candles: { family: string; color: string; min: number; max: number; count: number }[];
	cprGrade: number | null;
	cprScore: number | null;
	onsightGrade: number | null;
	redpointGrade: number | null;
};

const TICK_FAMILY: { match: (t: string) => boolean; family: string; color: string; order: number }[] = [
	{ match: (t) => t.includes('sight'), family: 'onsight', color: '#54b41a', order: 0 },
	{ match: (t) => t.includes('flash'), family: 'flash', color: '#fee100', order: 1 },
	{
		match: (t) => t.includes('red') && t.includes('point'),
		family: 'redpoint',
		color: '#c90909',
		order: 2
	},
	{
		match: (t) => t.includes('pink'),
		family: 'pinkpoint',
		color: '#e83e8c',
		order: 3
	},
	{
		match: (t) => t === 'send' || t === 'tick' || t === 'clean',
		family: 'send',
		color: '#1d6fa5',
		order: 4
	},
	{
		match: (t) => t.includes('attempt') || t.includes('hang') || t.includes('working'),
		family: 'other',
		color: '#b0b0b0',
		order: 5
	}
];

function tickFamily(tickType: string | null): { family: string; color: string; order: number } {
	const t = (tickType || '').toLowerCase();
	for (const f of TICK_FAMILY) {
		if (f.match(t)) return f;
	}
	return { family: 'other', color: '#b0b0b0', order: 5 };
}

function periodKey(iso: string): string {
	// Quarterly buckets for timeline readability
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso.slice(0, 7);
	const q = Math.floor(d.getUTCMonth() / 3) + 1;
	return `${d.getUTCFullYear()}-Q${q}`;
}

export function buildCprTimeline(
	inputs: CprAscentInput[],
	style: CprStyle
): { buckets: TimelineBucket[]; peakScore: number | null; currentScore: number | null; peakGrade: number | null; currentGrade: number | null } {
	const styleAscents = inputs.filter((a) => normalizeClimbStyle(a.gearStyle) === style && a.ascentDate);
	const best = bestTicksByRoute(inputs, style);

	const periods = new Map<string, CprAscentInput[]>();
	for (const a of styleAscents) {
		const key = periodKey(a.ascentDate!);
		const list = periods.get(key) ?? [];
		list.push(a);
		periods.set(key, list);
	}

	const keys = [...periods.keys()].sort();
	const buckets: TimelineBucket[] = [];

	for (const key of keys) {
		const list = periods.get(key)!;
		const end = new Date(list.map((a) => a.ascentDate!).sort().at(-1)!);
		const cpr = cprGradeAt(best, end);

		const byFamily = new Map<string, { color: string; order: number; grades: number[] }>();
		for (const a of list) {
			if (a.gradeScore == null) continue;
			const fam = tickFamily(a.tickType);
			const slot = byFamily.get(fam.family) ?? { color: fam.color, order: fam.order, grades: [] };
			slot.grades.push(a.gradeScore);
			byFamily.set(fam.family, slot);
		}

		const candles = [...byFamily.entries()]
			.map(([family, v]) => ({
				family,
				color: v.color,
				order: v.order,
				min: Math.min(...v.grades),
				max: Math.max(...v.grades),
				count: v.grades.length
			}))
			.sort((a, b) => b.order - a.order); // grey under, onsight on top visually when stacked

		const onsights = list.filter((a) => (a.tickType || '').toLowerCase().includes('sight') && a.gradeScore != null);
		const reds = list.filter(
			(a) =>
				a.gradeScore != null &&
				((a.tickType || '').toLowerCase().includes('red') ||
					(style === 'boulder' && (a.tickType || '').toLowerCase() === 'send'))
		);

		buckets.push({
			period: key,
			label: key,
			volume: list.length,
			candles: candles.map(({ family, color, min, max, count }) => ({
				family,
				color,
				min,
				max,
				count
			})),
			cprGrade: cpr,
			cprScore: cprScoreLabel(cpr),
			onsightGrade: onsights.length ? Math.max(...onsights.map((a) => a.gradeScore!)) : null,
			redpointGrade: reds.length ? Math.max(...reds.map((a) => a.gradeScore!)) : null
		});
	}

	const now = new Date();
	const currentGrade = cprGradeAt(best, now);
	let peakGrade: number | null = null;
	for (const b of buckets) {
		if (b.cprGrade != null && (peakGrade == null || b.cprGrade > peakGrade)) peakGrade = b.cprGrade;
	}

	return {
		buckets,
		peakGrade,
		currentGrade,
		peakScore: cprScoreLabel(peakGrade),
		currentScore: cprScoreLabel(currentGrade)
	};
}
