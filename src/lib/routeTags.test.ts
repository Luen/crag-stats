import { describe, expect, it } from 'vitest';
import {
	parseTagExactParam,
	parseTagExactParams,
	parseTagsJson,
	routeHasExactTag
} from './routeTags';

describe('parseTagExactParam', () => {
	it('parses Category:Name with trim and case preserved in output', () => {
		expect(parseTagExactParam(' Steepness : Vertical ')).toEqual({
			category: 'Steepness',
			name: 'Vertical'
		});
	});

	it('rejects values without a colon or empty parts', () => {
		expect(parseTagExactParam('')).toBeNull();
		expect(parseTagExactParam('nocolon')).toBeNull();
		expect(parseTagExactParam(':name')).toBeNull();
		expect(parseTagExactParam('cat:')).toBeNull();
	});
});

describe('routeHasExactTag', () => {
	const json = JSON.stringify([
		{ category: 'Steepness', name: 'Vertical' },
		{ category: 'Rock type', name: 'Granite' }
	]);

	it('matches case-insensitively on category and name', () => {
		expect(routeHasExactTag(json, 'steepness', 'vertical')).toBe(true);
		expect(routeHasExactTag(json, 'Rock Type', 'GRANITE')).toBe(true);
	});

	it('does not match the same name under a different category', () => {
		expect(routeHasExactTag(json, 'Aspect', 'Vertical')).toBe(false);
	});
});

describe('parseTagsJson', () => {
	it('returns structured tags from tags_json', () => {
		expect(parseTagsJson(JSON.stringify([{ category: 'Style', name: 'Crack' }]))).toEqual([
			{ category: 'Style', name: 'Crack' }
		]);
	});
});

describe('parseTagExactParams', () => {
	it('dedupes repeated pairs', () => {
		expect(parseTagExactParams(['Steepness:Vertical', ' steepness : vertical '])).toEqual([
			{ category: 'Steepness', name: 'Vertical' }
		]);
	});
});
