import { expect, it } from 'vitest';
import { weatherPolygonPoint } from './weatherPolygon';
// Synthetic GeoJSON only, never claimed as captured theCrag payloads.
const box = (x: number, y: number, size: number) => [
	[x, y],
	[x + size, y],
	[x + size, y + size],
	[x, y + size],
	[x, y]
];
const polygon = (...rings: number[][][]) => ({ type: 'Polygon', coordinates: rings });
it('reads the supplied first exterior coordinate in longitude/latitude order, not the centre', () => {
	expect(weatherPolygonPoint(polygon(box(150, -33, 0.04)))).toEqual({ lon: 150, lat: -33 });
	const concave = [
		[0, 0],
		[0.04, 0],
		[0.04, 0.01],
		[0.01, 0.01],
		[0.01, 0.04],
		[0, 0.04],
		[0, 0]
	];
	expect(weatherPolygonPoint(polygon(concave))).toEqual({ lon: 0, lat: 0 });
});
it('takes the first exterior vertex rather than a hole or another multipolygon component', () => {
	const a = box(10, 20, 0.04),
		hole = box(10.01, 20.01, 0.02),
		b = box(10.06, 20, 0.02);
	expect(weatherPolygonPoint(polygon(a, hole))).toEqual({ lon: 10, lat: 20 });
	expect(weatherPolygonPoint({ type: 'MultiPolygon', coordinates: [[a, hole], [b]] })).toEqual({
		lon: 10,
		lat: 20
	});
});
it('rejects unsupported, malformed, open, collapsed and nonnumeric coordinate arrays', () => {
	for (const shape of [
		null,
		[],
		{ type: 'Point', coordinates: [0, 0] },
		polygon(),
		polygon(box(0, 0, 0.02).slice(0, -1)),
		polygon([
			[0, 0],
			[0, 0],
			[0, 0],
			[0, 0]
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
		{ type: 'MultiPolygon', coordinates: [[box(0, 0, 0.01)], []] }
	])
		expect(weatherPolygonPoint(shape)).toBeNull();
});
it('rejects broad, dateline, polar, out-of-range and excessively large geometry', () => {
	for (const shape of [
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
		{ type: 'MultiPolygon', coordinates: Array(17).fill([box(0, 0, 0.01)]) },
		polygon(Array.from({ length: 257 }, (_, i) => [i / 10000, 0]))
	])
		expect(weatherPolygonPoint(shape)).toBeNull();
});
