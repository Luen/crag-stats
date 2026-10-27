import { describe, expect, it } from 'vitest';
import { describeSendPreference } from './analytics';

describe('describeSendPreference', () => {
	it('favours onsighting when first-go ticks dominate', () => {
		expect(
			describeSendPreference({
				onsightCount: 40,
				flashCount: 10,
				redpointCount: 20,
				pinkpointCount: 5,
				totalSends: 80
			})
		).toMatch(/onsight/i);
	});

	it('favours working / redpointing when those dominate', () => {
		expect(
			describeSendPreference({
				onsightCount: 5,
				flashCount: 2,
				redpointCount: 50,
				pinkpointCount: 10,
				totalSends: 80
			})
		).toMatch(/work routes|redpoint/i);
	});

	it('falls back to a mixed style when neither side wins clearly', () => {
		expect(
			describeSendPreference({
				onsightCount: 20,
				flashCount: 5,
				redpointCount: 22,
				pinkpointCount: 3,
				totalSends: 60
			})
		).toMatch(/mix/i);
	});
});
