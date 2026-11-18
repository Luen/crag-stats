import { describe, expect, it } from 'vitest';
import { buildCprColumns, cprRuns, hasCprGaps, quarterOrdinal, quarterPeriod } from './cprTimeline';
import type { TimelineBucket } from './types/dashboard';

function bucket(period: string, cprGrade: number | null = 18, volume = 1): TimelineBucket {
	return {
		period,
		label: period,
		volume,
		candles: [],
		cprGrade,
		cprScore: null,
		onsightGrade: null,
		redpointGrade: null
	};
}

describe('quarter helpers', () => {
	it('round-trips every quarter', () => {
		expect(quarterPeriod(quarterOrdinal('2019-Q3')!)).toBe('2019-Q3');
		expect(quarterPeriod(quarterOrdinal('2000-Q1')!)).toBe('2000-Q1');
		expect(quarterOrdinal('2019-Q3')).toBe(2019 * 4 + 2);
	});

	it('rejects malformed periods instead of guessing', () => {
		for (const period of ['2019-Q0', '2019-Q5', '2019-03', '19-Q2', '2019-Q3x', '']) {
			expect(quarterOrdinal(period)).toBeNull();
		}
	});
});

describe('buildCprColumns', () => {
	const buckets = [bucket('2019-Q2'), bucket('2019-Q3'), bucket('2021-Q1')];

	it('keeps only logged quarters in compact mode', () => {
		expect(buildCprColumns(buckets, 'compact').map((c) => c.period)).toEqual([
			'2019-Q2',
			'2019-Q3',
			'2021-Q1'
		]);
		expect(buildCprColumns(buckets, 'compact').map((c) => c.bucket)).toEqual(buckets);
	});

	it('inserts every skipped quarter in all mode', () => {
		const columns = buildCprColumns(buckets, 'all');
		expect(columns.map((c) => c.period)).toEqual([
			'2019-Q2',
			'2019-Q3',
			'2019-Q4',
			'2020-Q1',
			'2020-Q2',
			'2020-Q3',
			'2020-Q4',
			'2021-Q1'
		]);
		expect(columns.map((c) => c.bucket == null)).toEqual([
			false,
			false,
			true,
			true,
			true,
			true,
			true,
			false
		]);
	});

	it('fills a single skipped quarter', () => {
		const columns = buildCprColumns([bucket('2020-Q1'), bucket('2020-Q3')], 'all');
		expect(columns.map((c) => c.period)).toEqual(['2020-Q1', '2020-Q2', '2020-Q3']);
		expect(columns[1]).toEqual({
			period: '2020-Q2',
			ordinal: quarterOrdinal('2020-Q2'),
			bucket: null
		});
	});

	it('never reorders or duplicates a real bucket', () => {
		const odd = bucket('not-a-quarter');
		const columns = buildCprColumns([bucket('2020-Q1'), odd, bucket('2020-Q3')], 'all');
		expect(columns.map((c) => c.period)).toEqual(['2020-Q1', 'not-a-quarter', '2020-Q3']);
		expect(columns.map((c) => c.bucket)).toContain(odd);
	});

	it('leaves a single bucket untouched', () => {
		expect(buildCprColumns([bucket('2024-Q4')], 'all')).toHaveLength(1);
	});
});

describe('hasCprGaps', () => {
	it('detects a missing quarter', () => {
		expect(hasCprGaps([bucket('2020-Q1'), bucket('2020-Q3')])).toBe(true);
		expect(hasCprGaps([bucket('2020-Q1'), bucket('2021-Q1')])).toBe(true);
	});

	it('is false for consecutive quarters and a single bucket', () => {
		expect(hasCprGaps([bucket('2020-Q1'), bucket('2020-Q2'), bucket('2020-Q3')])).toBe(false);
		expect(hasCprGaps([bucket('2020-Q1')])).toBe(false);
		expect(hasCprGaps([])).toBe(false);
	});

	it('ignores unparsable periods rather than inventing a gap', () => {
		expect(hasCprGaps([bucket('2020-Q1'), bucket('unknown'), bucket('2020-Q2')])).toBe(false);
	});
});

describe('cprRuns', () => {
	const columns = buildCprColumns(
		[bucket('2020-Q1', 18), bucket('2020-Q2', 19), bucket('2020-Q4', 20), bucket('2021-Q1', 21)],
		'all'
	);

	it('joins consecutive data columns when gaps are collapsed', () => {
		expect(cprRuns(columns, false)).toEqual([[0, 1, 3, 4]]);
	});

	it('breaks the run across an empty quarter', () => {
		// 2020-Q3 is a placeholder (index 2).
		expect(cprRuns(columns, true)).toEqual([
			[0, 1],
			[3, 4]
		]);
	});

	it('also breaks when an unexpanded jump in quarters is present', () => {
		const compact = buildCprColumns(
			[bucket('2020-Q1'), bucket('2020-Q4'), bucket('2021-Q1')],
			'compact'
		);
		expect(cprRuns(compact, true)).toEqual([[0], [1, 2]]);
	});

	it('skips buckets without a CPR grade', () => {
		const mixed = buildCprColumns(
			[bucket('2020-Q1', null), bucket('2020-Q2', 18), bucket('2020-Q3', null)],
			'all'
		);
		expect(cprRuns(mixed, true)).toEqual([[1]]);
	});
});
