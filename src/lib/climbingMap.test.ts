import { expect, it } from 'vitest';
import {
	clusterMapPlaces,
	fitMapPlaces,
	longitudeCentre,
	mapPlaceKey,
	validMapCoords,
	type ClimbingPlace
} from './climbingMap';
const place = (key: string, lon: number, count = 1): ClimbingPlace => ({
	key,
	name: key,
	country: null,
	lat: 0,
	lon,
	count,
	routes: 1,
	firstDay: null,
	lastDay: null,
	href: '/logbook'
});
it('keeps dateline places together without averaging them to Greenwich', () => {
	const p = [place('a', 179), place('b', -179)];
	const c = longitudeCentre(p);
	expect(Math.abs(c)).toBe(180);
	expect(fitMapPlaces(p, c).width).toBe(80);
});
it('never counts a place twice while clustering at different zooms', () => {
	const places = Array.from({ length: 400 }, (_, i) => ({
		...place(String(i), i / 100, 2),
		lat: i / 200
	}));
	for (const view of [{ x: 0, y: 0, width: 1000, height: 500 }, fitMapPlaces(places, 0)]) {
		const groups = clusterMapPlaces(places, view, 0);
		expect(groups.reduce((n, g) => n + g.count, 0)).toBe(800);
		expect(groups.flatMap((g) => g.places).length).toBe(400);
		expect(groups.length).toBeLessThan(150);
	}
});
it('uses provider area identity and rejects invalid coordinates without rejecting zero', () => {
	const row = {
		routeProvider: 'thecrag',
		areaExternalId: '42',
		cragName: 'Before',
		country: 'AU',
		lat: 0,
		lon: 0
	};
	expect(mapPlaceKey(row)).toBe(mapPlaceKey({ ...row, cragName: 'After' }));
	expect(mapPlaceKey(row)).not.toBe(mapPlaceKey({ ...row, routeProvider: 'other' }));
	expect(validMapCoords(0, 0)).toBe(true);
	for (const [lat, lon] of [
		[NaN, 1],
		[1, 181],
		[91, 1],
		[Infinity, 0]
	])
		expect(validMapCoords(lat, lon)).toBe(false);
});
it('fits a selection with a small floor without cropping its spread', () => {
	const sel = [place('a', 10), place('b', 40)].map((p) => ({ ...p, lat: 10 }));
	const view = fitMapPlaces(sel, 25, 8);
	for (const p of sel) {
		const x = 500 + ((p.lon - 25) / 360) * 1000;
		expect(x).toBeGreaterThanOrEqual(view.x);
		expect(x).toBeLessThanOrEqual(view.x + view.width);
	}
	expect(fitMapPlaces([place('a', 10), place('b', 10.1)], 10, 8).width).toBeLessThan(80);
});
