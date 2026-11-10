import { describe, expect, it } from 'vitest';
import { THECRAG_GRADE_SCORES } from './thecragGradeScores';
import { theCragGradeBucket } from './thecragScale';

describe.each(['FR', 'YDS', 'FB'] as const)('%s pyramid buckets', (system) => {
	it('assigns midpoint ties to the upper half-open bucket', () => {
		const ladder = THECRAG_GRADE_SCORES[system];
		for (let i = 1; i < ladder.length; i++) {
			const midpoint = (ladder[i - 1][1] + ladder[i][1]) / 2;
			const bucket = theCragGradeBucket(system, midpoint)!;
			expect(bucket.label).toBe(ladder[i][0]);
			expect(midpoint).toBeGreaterThanOrEqual(bucket.min);
			expect(midpoint).toBeLessThan(bucket.max);
		}
	});

	it('does not return a bucket at its exclusive upper ladder edge', () => {
		const ladder = THECRAG_GRADE_SCORES[system];
		const last = theCragGradeBucket(system, ladder.at(-1)![1])!;
		expect(theCragGradeBucket(system, last.max)).toBeNull();
		expect(theCragGradeBucket(system, NaN)).toBeNull();
	});
});
