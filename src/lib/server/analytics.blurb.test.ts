/** Re-export coverage lives in climberBlurb.test.ts; keep this file importing the analytics re-export. */
import { describe, expect, it } from 'vitest';
import { describeSendPreference } from './analytics';

describe('describeSendPreference (analytics re-export)', () => {
	it('still exports from analytics for callers', () => {
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
});
