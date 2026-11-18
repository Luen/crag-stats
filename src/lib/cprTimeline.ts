import type { TimelineBucket } from '#lib/types/dashboard';

/**
 * How the CPR timeline treats quarters with no logged ascent.
 *
 * - `compact`: one column per quarter that has ascents (the shipped behaviour), so long
 *   layoffs collapse and the curve runs through them.
 * - `all`: insert an empty column for every skipped quarter between the first and last
 *   logged quarter, and break the curve across them (#488).
 */
export type CprGapMode = 'compact' | 'all';

export type CprColumn = {
	/** `YYYY-Qn`, shown on the time axis. */
	period: string;
	/** Absolute quarter number (`year * 4 + quarter - 1`), when the period parses. */
	ordinal: number | null;
	/** The logged bucket, or null for a quarter with no ascents. */
	bucket: TimelineBucket | null;
};

/** `"2019-Q3"` → `8074`; anything else → null. */
export function quarterOrdinal(period: string): number | null {
	const match = /^(\d{4})-Q([1-4])$/.exec(period);
	return match ? Number(match[1]) * 4 + Number(match[2]) - 1 : null;
}

/** Inverse of {@link quarterOrdinal}: `8074` → `"2019-Q3"`. */
export function quarterPeriod(ordinal: number): string {
	const year = Math.floor(ordinal / 4);
	return `${String(year).padStart(4, '0')}-Q${(ordinal % 4) + 1}`;
}

function toColumn(bucket: TimelineBucket): CprColumn {
	return { period: bucket.period, ordinal: quarterOrdinal(bucket.period), bucket };
}

/**
 * Build the columns the chart renders. Real buckets keep their server order; in `all` mode
 * empty quarters are inserted between two parsed neighbours. A period that does not parse is
 * kept as-is rather than guessed at, so a malformed label can never reorder the timeline.
 */
export function buildCprColumns(buckets: readonly TimelineBucket[], mode: CprGapMode): CprColumn[] {
	const columns: CprColumn[] = [];
	let previous: CprColumn | null = null;
	for (const bucket of buckets) {
		const column = toColumn(bucket);
		if (
			mode === 'all' &&
			previous?.ordinal != null &&
			column.ordinal != null &&
			column.ordinal - previous.ordinal > 1
		) {
			for (let ordinal = previous.ordinal + 1; ordinal < column.ordinal; ordinal++) {
				columns.push({ period: quarterPeriod(ordinal), ordinal, bucket: null });
			}
		}
		columns.push(column);
		previous = column;
	}
	return columns;
}

/** True when at least one quarter between logged quarters has no ascents. */
export function hasCprGaps(buckets: readonly TimelineBucket[]): boolean {
	let previous: number | null = null;
	for (const bucket of buckets) {
		const ordinal = quarterOrdinal(bucket.period);
		if (ordinal == null) continue;
		if (previous != null && ordinal - previous > 1) return true;
		previous = ordinal;
	}
	return false;
}

/**
 * Split plotted columns into runs that may be joined by one curve. `breakAtGaps` mirrors
 * the selected mode: in `all` mode a placeholder — or a jump in quarter numbers — starts a
 * new run, so the line never implies progress through a quarter with no ascents.
 */
export function cprRuns(columns: readonly CprColumn[], breakAtGaps: boolean): number[][] {
	const runs: number[][] = [];
	let run: number[] = [];
	let previous: number | null = null;
	columns.forEach((column, index) => {
		const grade = column.bucket?.cprGrade;
		if (grade == null || !Number.isFinite(grade)) return;
		if (
			run.length > 0 &&
			breakAtGaps &&
			previous != null &&
			column.ordinal != null &&
			column.ordinal - previous > 1
		) {
			runs.push(run);
			run = [];
		}
		run.push(index);
		previous = column.ordinal;
	});
	if (run.length > 0) runs.push(run);
	return runs;
}
