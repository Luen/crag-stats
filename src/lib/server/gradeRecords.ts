import { formatGradeLabel, usesVScale, type DisplayGradeSystems } from '#lib/grades';
import { tickKind } from '#lib/ticks';
import type { GradeRecord } from '#lib/types/dashboard';

type RecordRow = {
	id: number;
	isSend: boolean;
	tickType: string | null;
	gradeScore: number | null;
	effectiveGradeScore: number | null;
	gradeSystem: string | null;
	gearStyle: string | null;
	routeName: string;
	href: string | null;
};

/** One record per scale, across the whole logbook. Attempts and unscored sends never qualify. */
export function buildGradeRecords(rows: readonly RecordRow[], systems: DisplayGradeSystems) {
	const sends = rows.flatMap((row) => {
		const score = row.effectiveGradeScore ?? row.gradeScore;
		return row.isSend && score != null && Number.isFinite(score) ? [{ row, score }] : [];
	});
	const firstGo = (row: RecordRow) => ['onsight', 'flash'].includes(tickKind(row.tickType));
	const records = (onlyFirstGo: boolean): GradeRecord[] => {
		const result: GradeRecord[] = [];
		for (const boulder of [false, true]) {
			const best = sends
				.filter(
					({ row }) =>
						usesVScale(row.gradeSystem, row.gearStyle) === boulder && (!onlyFirstGo || firstGo(row))
				)
				.sort(
					(a, b) =>
						b.score - a.score ||
						Number(tickKind(b.row.tickType) === 'onsight') -
							Number(tickKind(a.row.tickType) === 'onsight') ||
						a.row.id - b.row.id
				)[0];
			if (!best) continue;
			const kind = tickKind(best.row.tickType);
			result.push({
				discipline: boulder ? 'boulder' : 'route',
				grade: formatGradeLabel(best.score, boulder, systems),
				tick:
					kind === 'onsight'
						? 'Onsighted'
						: kind === 'flash'
							? 'Flashed'
							: best.row.tickType || 'Sent',
				routeName: best.row.routeName,
				href: best.row.href
			});
		}
		return result;
	};
	return { sends: records(false), onsightFlash: records(true) };
}
