import { describe, expect, it } from 'vitest';
import { bandFromVScale, boulderPyramidScoreKey } from './bands';

describe('bandFromVScale', () => {
	it('matches theCrag boulder bands (V0 is Intermediate / yellow)', () => {
		expect(bandFromVScale(-1.5)?.name).toBe('Beginner'); // VB-
		expect(bandFromVScale(-1)?.name).toBe('Beginner'); // VB
		expect(bandFromVScale(-0.5)?.name).toBe('Beginner'); // VB+
		expect(bandFromVScale(-0.3)?.name).toBe('Intermediate'); // V0-
		expect(bandFromVScale(0)?.name).toBe('Intermediate'); // V0
		expect(bandFromVScale(0.3)?.name).toBe('Intermediate'); // V0+
		expect(bandFromVScale(1)?.name).toBe('Experienced');
		expect(bandFromVScale(4)?.name).toBe('Experienced');
		expect(bandFromVScale(5)?.name).toBe('Expert');
		expect(bandFromVScale(11)?.name).toBe('Elite');
	});
});

describe('boulderPyramidScoreKey', () => {
	it('keeps VB+ out of the V0 bucket', () => {
		expect(boulderPyramidScoreKey(-0.5)).toBe(-0.5);
		expect(boulderPyramidScoreKey(-0.3)).toBe(0);
		expect(boulderPyramidScoreKey(0)).toBe(0);
		expect(boulderPyramidScoreKey(0.3)).toBe(0);
		expect(boulderPyramidScoreKey(1)).toBe(1);
	});
});
