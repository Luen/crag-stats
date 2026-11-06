import { calendarDay } from '#lib/calendarDay';
import { sessionReadiness } from '#lib/readiness';
import { usesVScale } from '#lib/grades';
import { climbStyleLabel } from '#lib/climbStyle';
import { classifyRouteProject, summarizeRouteAscents } from './projects';

/** Public metadata only: private comments/raw provider payloads never enter this model. */
export type ProjectProgressRow = {
	ascentId: number;
	routeId: number;
	ascentDate: string | null;
	isSend: boolean;
	isAttempt: boolean;
	numberAttempts: number | null;
	effectiveGradeScore: number | null;
	gradeScore: number | null;
	gradeSystem: string | null;
	gearStyle: string | null;
};

export type ProjectTarget = Pick<
	ProjectProgressRow,
	'routeId' | 'gradeScore' | 'gradeSystem' | 'gearStyle'
>;

function sameDiscipline(a: ProjectTarget, b: ProjectTarget) {
	return (
		climbStyleLabel(a.gearStyle) === climbStyleLabel(b.gearStyle) &&
		usesVScale(a.gradeSystem, a.gearStyle) === usesVScale(b.gradeSystem, b.gearStyle)
	);
}

function scoreOf(row: ProjectProgressRow) {
	const score = row.effectiveGradeScore ?? row.gradeScore;
	return score != null && Number.isFinite(score) ? score : null;
}

function evidence(target: ProjectTarget, rows: ProjectProgressRow[], day: string) {
	const targetScore = target.gradeScore;
	if (targetScore == null || !Number.isFinite(targetScore)) return null;
	const cutoff = Date.parse(`${day}T00:00:00Z`) - 365 * 86400000;
	const sends = rows.filter((row) => {
		const date = calendarDay(row.ascentDate);
		return (
			row.isSend &&
			row.routeId !== target.routeId &&
			date &&
			date <= day &&
			Date.parse(`${date}T00:00:00Z`) >= cutoff &&
			sameDiscipline(target, row)
		);
	});
	const scores = sends.map(scoreOf).filter((score): score is number => score != null);
	const best = scores.length ? Math.max(...scores) : null;
	const at = (low: number, high: number) =>
		new Set(
			sends
				.filter((row) => {
					const score = scoreOf(row);
					return score != null && score >= low && score < high;
				})
				.map((row) => row.routeId)
		).size;
	return { best, n1: at(targetScore - 1, targetScore), n2: at(targetScore - 2, targetScore - 1) };
}

function readiness(
	target: ProjectTarget,
	rows: ProjectProgressRow[],
	own: ProjectProgressRow[],
	day: string
) {
	const support = evidence(target, rows, day);
	const sent = own.some((row) => row.isSend);
	if (sent) return { pct: 100, support, horizon: 'Sent' };
	if (!support) return { pct: null, support, horizon: 'Unknown grade' };
	const gap = support.best == null ? Infinity : target.gradeScore! - support.best;
	const horizon = gap <= 1 ? 'Short-term' : gap <= 2 ? 'Medium' : 'Long-haul';
	const effortNeed = gap <= 1 ? 15 : gap <= 2 ? 35 : 75;
	const tries = summarizeRouteAscents(own).tryCount;
	const base = gap <= 0 ? 60 : gap <= 1 ? 35 : gap <= 2 ? 10 : 0;
	const pct = sessionReadiness(
		Math.round(
			base +
				20 * Math.min(support.n1 / 2, 1) +
				25 * Math.min(support.n2 / 4, 1) +
				15 * Math.min(tries / effortNeed, 1)
		),
		summarizeRouteAscents(own).sessionCount
	);
	return { pct, support, horizon };
}

function range(values: number[]): [number, number] {
	const sorted = [...values].sort((a, b) => a - b);
	return [
		sorted[Math.floor((sorted.length - 1) * 0.25)],
		sorted[Math.ceil((sorted.length - 1) * 0.75)]
	];
}

/** A historical comparison, never a send probability or a deadline. */
export function projectProgress(
	target: ProjectTarget,
	allRows: ProjectProgressRow[],
	today: string
) {
	const rows = allRows.filter((row) => {
		const day = calendarDay(row.ascentDate);
		return day != null && day <= today;
	});
	const own = rows.filter((row) => row.routeId === target.routeId);
	const stats = summarizeRouteAscents(own);
	const current = readiness(target, rows, own, today);
	const days = [...new Set(own.map((row) => calendarDay(row.ascentDate)!))].sort();
	const sessions = days.map((day) => {
		const entries = own.filter((row) => calendarDay(row.ascentDate) === day);
		const cumulative = own.filter((row) => calendarDay(row.ascentDate)! <= day);
		return {
			day,
			entries: entries.length,
			failedTries: summarizeRouteAscents(entries).tryCount,
			sends: entries.filter((row) => row.isSend).length,
			cumulativeTries: summarizeRouteAscents(cumulative).tryCount,
			readiness: readiness(target, rows, cumulative, day).pct
		};
	});
	const comparable = new Map<number, ProjectProgressRow[]>();
	if (target.gradeScore != null && Number.isFinite(target.gradeScore)) {
		for (const row of rows) {
			if (
				row.routeId === target.routeId ||
				!sameDiscipline(target, row) ||
				row.gradeScore == null ||
				Math.abs(row.gradeScore - target.gradeScore) > 1
			)
				continue;
			const list = comparable.get(row.routeId) ?? [];
			list.push(row);
			comparable.set(row.routeId, list);
		}
	}
	const samples = [...comparable.values()].flatMap((entries) => {
		const summary = summarizeRouteAscents(entries);
		if (classifyRouteProject(summary) !== 'sent') return [];
		// A lower-grade pitch send cannot stand in for a send of the whole route.
		const firstSend = entries.find((row) => row.isSend && row.ascentDate === summary.sentAt);
		if (!firstSend || scoreOf(firstSend) == null || scoreOf(firstSend)! < firstSend.gradeScore!)
			return [];
		return [{ sessions: summary.sessionsThroughSend, tries: summary.triesBeforeSend + 1 }];
	});
	const remainingSessions = samples.filter((s) => s.sessions > stats.sessionCount);
	const remainingTries = samples.filter((s) => s.tries > stats.tryCount);
	const forecast =
		stats.sendCount > 0
			? null
			: {
					sampleCount: samples.length,
					sessionSampleCount: remainingSessions.length,
					trySampleCount: remainingTries.length,
					sessions:
						remainingSessions.length >= 3
							? range(remainingSessions.map((s) => s.sessions - stats.sessionCount))
							: null,
					tries:
						remainingTries.length >= 3
							? range(remainingTries.map((s) => s.tries - stats.tryCount))
							: null
				};
	return {
		...current,
		stats,
		sessions,
		forecast,
		excludedEntries: allRows.filter((row) => row.routeId === target.routeId).length - own.length
	};
}
