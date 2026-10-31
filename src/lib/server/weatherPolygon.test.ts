import { expect, it } from 'vitest';
import { weatherPolygonPoint } from './weatherPolygon';

// Synthetic GeoJSON only. These are NOT captured theCrag payloads.
const box = (x: number, y: number, size: number) => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y]
];
const polygon = (...rings: number[][][]) => ({ type: 'Polygon', coordinates: rings });

it('finds a strictly interior point in a concave polygon whose centroid is outside', () => {
	const shape = [
		[0, 0],
		[0.04, 0],
		[0.04, 0.01],
		[0.01, 0.01],
		[0.01, 0.04],
		[0, 0.04],
		[0, 0]
	];
	const p = weatherPolygonPoint(polygon(shape));
	expect(p).not.toBeNull();
	expect(p!.lat).toBeGreaterThan(0);
	expect(p!.lon).toBeGreaterThan(0);
	expect(p!.lat < 0.01 || p!.lon < 0.01).toBe(true);
});

it('avoids holes and ignores ring winding', () => {
	const outer = box(10, 20, 0.04),
		hole = box(10.01, 20.01, 0.02);
	const p = weatherPolygonPoint(polygon(outer, hole));
	expect(p).not.toBeNull();
	expect(p!.lat > 20.01 && p!.lat < 20.03 && p!.lon > 10.01 && p!.lon < 10.03).toBe(false);
	expect(weatherPolygonPoint(polygon(outer.toReversed(), hole.toReversed()))).toEqual(p);
});

it('handles disjoint multipolygons and rejects overlapping components', () => {
	const a = box(0, 0, 0.01),
		b = box(0.03, 0, 0.02);
	const p = weatherPolygonPoint({ type: 'MultiPolygon', coordinates: [[a], [b]] });
	expect(p).not.toBeNull();
	expect(p!.lon).toBeGreaterThan(0.03);
	expect(p!.lon).toBeLessThan(0.05);
	expect(
		weatherPolygonPoint({ type: 'MultiPolygon', coordinates: [[a], [box(0.005, 0.005, 0.01)]] })
	).toBeNull();
});

it('rejects self crossings, open/degenerate rings and invalid hole topology', () => {
	for (const shape of [
		polygon([
			[0, 0],
			[0.03, 0.03],
			[0, 0.03],
			[0.03, 0],
			[0, 0]
		]),
		polygon(box(0, 0, 0.02).slice(0, -1)),
		polygon([
			[0, 0],
			[0.01, 0.01],
			[0.02, 0.02],
			[0, 0]
		]),
		polygon(box(0, 0, 0.02), box(0.03, 0.03, 0.01)),
		polygon(box(0, 0, 0.02), box(0.015, 0.015, 0.01)),
		polygon(box(0, 0, 0.04), box(0.01, 0.01, 0.02), box(0.015, 0.015, 0.005)),
		polygon(box(0, 0, 0.04), box(0.01, 0.01, 0.02), box(0.02, 0.02, 0.015))
	])
		expect(weatherPolygonPoint(shape)).toBeNull();
});

it('fails closed on broad, dateline, polar, malformed or oversized geometry', () => {
	for (const shape of [
		null,
		[],
		{ type: 'Point', coordinates: [0, 0] },
		polygon(),
		polygon(box(0, 0, 1)),
		polygon(box(181, 0, 0.01)),
		polygon(box(0, 89, 0.01)),
		polygon([
			[179.99, 0],
			[-179.99, 0],
			[-179.99, 0.01],
			[179.99, 0.01],
			[179.99, 0]
		]),
		polygon([
			[0, 0],
			[NaN, 0],
			[0.01, 0.01],
			[0, 0]
		]),
		polygon([
			[0, 0],
			[Infinity, 0],
			[0.01, 0.01],
			[0, 0]
		]),
		{
			type: 'Polygon',
			coordinates: [
				[
					['0', 0],
					[0.01, 0],
					[0.01, 0.01],
					['0', 0]
				]
			]
		},
		{ type: 'MultiPolygon', coordinates: Array(17).fill([box(0, 0, 0.01)]) },
		polygon(Array.from({ length: 257 }, (_, i) => [i / 10000, 0]))
	])
		expect(weatherPolygonPoint(shape)).toBeNull();
});
