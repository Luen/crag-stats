import { describe, expect, it } from 'vitest';
import { csvGradeSystemHint, csvRowLooksAustralian, mapTheCragCsvRow } from './csv';

function row(overrides: Record<string, string> = {}) {
	return {
		'Ascent ID': '2631769824',
		'Route ID': '3',
		'Route Name': 'Upendi',
		'Ascent Type': 'Repeat',
		'Route Grade': '9',
		'Ascent Grade': '',
		'Route Gear Style': 'Boulder',
		'Ascent Gear Style': 'Boulder',
		Country: 'Australia',
		'Crag Path': 'Australia - Queensland - Magnetic Island',
		'Route Link': 'https://www.thecrag.com/en/climbing/australia/magnetic-island/route/3',
		'Ascent Date': '2019-02-23',
		'Log Date': '2019-07-26',
		...overrides
	};
}

describe('csvRowLooksAustralian', () => {
	it('matches Country Australia', () => {
		expect(csvRowLooksAustralian({ Country: 'Australia' })).toBe(true);
	});

	it('matches Crag Path / Route Link australia stubs', () => {
		expect(csvRowLooksAustralian({ 'Crag Path': 'australia/magnetic-island' })).toBe(true);
		expect(
			csvRowLooksAustralian({
				'Route Link': 'https://www.thecrag.com/en/climbing/australia/foo/route/1'
			})
		).toBe(true);
	});

	it('rejects non-Australian rows', () => {
		expect(csvRowLooksAustralian({ Country: 'Spain', 'Crag Path': 'spain/el-chorro' })).toBe(false);
	});
});

describe('csvGradeSystemHint', () => {
	it('hints AU for bare boulder digits in Australia', () => {
		expect(csvGradeSystemHint(row(), '9', 'Boulder')).toBe('AU');
		expect(csvGradeSystemHint(row({ 'Route Grade': '1' }), '1', 'Boulder')).toBe('AU');
	});

	it('does not hint AU for explicit V-scale labels (#124)', () => {
		expect(csvGradeSystemHint(row({ 'Route Grade': 'V5' }), 'V5', 'Boulder')).toBeNull();
		expect(csvGradeSystemHint(row({ 'Route Grade': 'VB' }), 'VB', 'Boulder')).toBeNull();
	});

	it('does not hint AU for sport or non-Australia boulder', () => {
		expect(csvGradeSystemHint(row(), '18', 'Sport')).toBeNull();
		expect(
			csvGradeSystemHint(
				row({ Country: 'Spain', 'Crag Path': 'spain/siurana', 'Route Link': '' }),
				'5',
				'Boulder'
			)
		).toBeNull();
	});
});

describe('mapTheCragCsvRow — AU boulder bare digits (#112)', () => {
	it('maps Australian bare route grade 9 to VB, not fake V9', () => {
		const mapped = mapTheCragCsvRow(row());
		expect(mapped).not.toBeNull();
		expect(mapped!.route.gradeScore).toBe(-0.7);
		expect(mapped!.effectiveGradeScore).toBe(-0.7);
		expect(mapped!.effectiveGradeRaw).not.toMatch(/^V9$/i);
		expect(mapped!.route.gradeSystem).toBe('v_scale');
	});

	it('keeps explicit V5 as V5', () => {
		const mapped = mapTheCragCsvRow(row({ 'Route Grade': 'V5', 'Ascent Grade': '' }));
		expect(mapped!.route.gradeScore).toBe(5);
		expect(mapped!.effectiveGradeScore).toBe(5);
		expect(mapped!.effectiveGradeRaw).toMatch(/V5/i);
	});

	it('keeps an explicit V route grade over an inferred AU ascent overlay', () => {
		const mapped = mapTheCragCsvRow(row({ 'Route Grade': 'V5', 'Ascent Grade': '12' }))!;
		expect(mapped.route.gradeScore).toBe(5);
		expect(mapped.effectiveGradeScore).toBe(5);
	});

	it('maps non-Australia bare boulder 5 to V5', () => {
		const mapped = mapTheCragCsvRow(
			row({
				Country: 'Spain',
				'Crag Path': 'spain/el-chorro',
				'Route Link': 'https://www.thecrag.com/en/climbing/spain/el-chorro/route/3',
				'Route Grade': '5'
			})
		);
		expect(mapped!.route.gradeScore).toBe(5);
		expect(mapped!.effectiveGradeScore).toBe(5);
	});
});
