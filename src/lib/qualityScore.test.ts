import { expect, it } from 'vitest';
import {
	ascentQualityScore,
	routeQualitySortKey,
	scatterQualityY,
	starsAsQualityFallback
} from './qualityScore';
it('orders all actual theCrag labels, including a known zero (#133)', () => {
	const labels = [
		'Crap',
		"Don't Bother",
		'Average',
		'Good',
		'Very Good',
		'Classic',
		'Mega Classic'
	];
	const scores = labels.map(ascentQualityScore);
	expect(scores).toEqual([0, 15, 35, 55, 75, 90, 100]);
	expect(routeQualitySortKey({ quality: 'Crap', stars: 3 })).toBe(0);
	expect(ascentQualityScore(' don’t   bother ')).toBe(15);
});
it('preserves provider-score and unknown-label/star fallback behavior', () => {
	expect(routeQualitySortKey({ qualityScore: 88, quality: 'Good', stars: 3 })).toBe(88);
	expect(routeQualitySortKey({ quality: 'unknown', stars: 3 })).toBe(starsAsQualityFallback(3));
	expect(routeQualitySortKey({ quality: 'unknown' })).toBe(-1);
	expect(scatterQualityY(3, 87.5)).toBe(87.5);
	expect(scatterQualityY(3, null)).toBe(100);
	expect(ascentQualityScore('*****')).toBe(100);
});
