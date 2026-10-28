import { describe, expect, it } from 'vitest';
import { routeQualitySortKey, scatterQualityY, starsAsQualityFallback } from './qualityScore';

describe('scatterQualityY', () => {
	it('prefers qualityScore over stars', () => {
		expect(scatterQualityY(3, 87.5)).toBe(87.5);
	});

	it('maps stars to 0–100 when score is missing', () => {
		expect(scatterQualityY(3, null)).toBe(100);
		expect(scatterQualityY(0, null)).toBe(0);
	});
});

describe('routeQualitySortKey', () => {
	it('prefers qualityScore over star fallback', () => {
		expect(routeQualitySortKey({ qualityScore: 92 })).toBe(92);
		expect(routeQualitySortKey({ quality: 'Good', stars: 1 })).toBeLessThan(92);
		expect(routeQualitySortKey({ stars: 3 })).toBe(starsAsQualityFallback(3));
	});
});
