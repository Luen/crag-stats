import { expect, it } from 'vitest';
import { upsertAscents } from './ingest';
import { listClimbingMap, readMapFilters } from './climbingMap';
import { listLogbook, wipeAllData } from './analytics';
import { listSectors } from './sectors';

it('hides the upstream deletion holding area without deleting its logbook ascents', () => {
	wipeAllData();
	upsertAscents(
		[' To Be Deleted ', 'Real crag'].map((cragName, i) => ({
			provider: 'thecrag',
			externalId: `placeholder-${i}`,
			ascentDate: '2026-01-01',
			isSend: true,
			isAttempt: false,
			route: {
				provider: 'thecrag',
				externalId: `placeholder-route-${i}`,
				name: 'A route',
				cragName,
				lat: 10,
				lon: 20
			}
		}))
	);
	const map = listClimbingMap(readMapFilters(new URLSearchParams()));
	expect(map.total).toBe(2);
	expect(map.missing).toBe(1);
	expect(map.places.map((p) => p.name)).toEqual(['Real crag']);
	expect(listSectors().map((c) => c.cragName)).toEqual(['Real crag']);
	expect(listLogbook({}).total).toBe(2);
});
it('groups stable areas, keeps same-name crags separate and links exact filtered counts', () => {
	wipeAllData();
	upsertAscents(
		Array.from({ length: 56 }, (_, i) => ({
			provider: 'thecrag',
			externalId: `map-${i}`,
			ascentDate: i === 55 ? '2018-00-00' : '2025-01-01',
			isSend: true,
			isAttempt: false,
			comment: 'private note must not leave server',
			route: {
				provider: 'thecrag',
				externalId: `map-route-${i}`,
				name: `Route ${i}`,
				cragName: i === 55 ? 'Climbing Gym' : 'Same name',
				gearStyle: 'Sport',
				areaExternalId: i < 52 ? 'a' : `area-${i}`,
				lat: i === 54 ? null : 10,
				lon: i === 54 ? null : 20,
				country: 'AU'
			}
		}))
	);
	const filters = readMapFilters(new URLSearchParams('from=2025-01-01&style=Sport&venue=outdoor'));
	const map = listClimbingMap(filters);
	expect(map.total).toBe(55);
	expect(map.missing).toBe(1);
	expect(map.places).toHaveLength(3);
	expect(map.places[0].count).toBe(52);
	expect(JSON.stringify(map)).not.toContain('private note');
	const url = new URL(map.places[0].href, 'http://localhost');
	expect(
		listLogbook({
			place: url.searchParams.get('place')!,
			mapVenue: 'outdoor',
			from: filters.from,
			styles: ['Sport']
		}).total
	).toBe(52);
	expect(listClimbingMap({ ...filters, venue: 'indoor' }).total).toBe(0);
});
