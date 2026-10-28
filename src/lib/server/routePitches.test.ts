import { describe, expect, it } from 'vitest';
import { classifyRoutePitches, isMissingPitchData } from './routePitches';

describe('classifyRoutePitches', () => {
	it('returns unchecked when route info was never fetched', () => {
		expect(classifyRoutePitches(null, false)).toBe('unchecked');
		expect(classifyRoutePitches('[]', false)).toBe('unchecked');
	});

	it('distinguishes null, empty, and known pitch lists after fetch', () => {
		expect(classifyRoutePitches(null, true)).toBe('null');
		expect(classifyRoutePitches('[]', true)).toBe('empty');
		expect(classifyRoutePitches(JSON.stringify([{ number: 1 }]), true)).toBe('known');
		expect(classifyRoutePitches(JSON.stringify([{ number: 1 }, { number: 2 }]), true)).toBe(
			'known'
		);
	});

	it('treats single-pitch routes as known, not missing', () => {
		const single = classifyRoutePitches(JSON.stringify([{ number: 1, grade: '20' }]), true);
		expect(single).toBe('known');
		expect(isMissingPitchData(single)).toBe(false);
	});
});

describe('isMissingPitchData', () => {
	it('matches only null and empty after fetch', () => {
		expect(isMissingPitchData('null')).toBe(true);
		expect(isMissingPitchData('empty')).toBe(true);
		expect(isMissingPitchData('unchecked')).toBe(false);
		expect(isMissingPitchData('known')).toBe(false);
	});
});
