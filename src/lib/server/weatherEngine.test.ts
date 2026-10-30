import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { wipeAllData } from './analytics';
import { db, ensureSchema } from './db';
import { ascents, routes, weatherDays } from './db/schema';
import type { OpenMeteoClient } from './providers/openMeteo';
import {
	DAYS_PER_RUN,
	listPendingWeatherDays,
	resetWeatherPacing,
	runWeatherImportOnce,
	weatherImportStatus
} from './weatherEngine';

function seedRouteAscent(opts: {
	routeExternalId: string;
	ascentExternalId: string;
	ascentDate: string;
	lat: number | null;
	lon: number | null;
	name?: string;
	cragName?: string;
	gearStyle?: string;
}) {
	ensureSchema();
	const route = db
		.insert(routes)
		.values({
			provider: 'thecrag',
			externalId: opts.routeExternalId,
			name: opts.name ?? 'Outdoor Route',
			cragName: opts.cragName ?? 'Real Crag',
			gearStyle: opts.gearStyle ?? 'Sport',
			lat: opts.lat,
			lon: opts.lon,
			updatedAt: '2024-01-01T00:00:00.000Z'
		})
		.returning({ id: routes.id })
		.get();
	db.insert(ascents)
		.values({
			provider: 'thecrag',
			externalId: opts.ascentExternalId,
			routeId: route!.id,
			ascentDate: opts.ascentDate,
			tickType: 'Red point',
			isSend: true,
			updatedAt: '2024-01-01T00:00:00.000Z'
		})
		.run();
}

describe('weatherEngine', () => {
	beforeEach(() => {
		ensureSchema();
		resetWeatherPacing();
		wipeAllData();
	});

	afterEach(() => {
		resetWeatherPacing();
	});

	it('queues outdoor days with coords and skips indoor / today', () => {
		const now = Date.parse('2024-06-15T12:00:00.000Z');
		seedRouteAscent({
			routeExternalId: 'r1',
			ascentExternalId: 'a1',
			ascentDate: '2024-01-10',
			lat: -33.87,
			lon: 151.21
		});
		seedRouteAscent({
			routeExternalId: 'r2',
			ascentExternalId: 'a2',
			ascentDate: '2024-06-15',
			lat: -33.87,
			lon: 151.21
		});
		seedRouteAscent({
			routeExternalId: 'r-gym',
			ascentExternalId: 'a-gym',
			ascentDate: '2024-01-11',
			lat: -33.8,
			lon: 151.1,
			name: 'Campus Board',
			cragName: 'Local Climbing Gym',
			gearStyle: 'Boulder'
		});

		const pending = listPendingWeatherDays(DAYS_PER_RUN, now);
		expect(pending).toEqual([{ latKey: -33.9, lonKey: 151.2, day: '2024-01-10' }]);
	});

	it('fetches and caches weather for pending days', async () => {
		const now = Date.parse('2024-06-15T12:00:00.000Z');
		seedRouteAscent({
			routeExternalId: 'r1',
			ascentExternalId: 'a1',
			ascentDate: '2024-01-10',
			lat: -33.87,
			lon: 151.21
		});

		const client: OpenMeteoClient = {
			fetchDaily: vi.fn(async () => ({
				ok: true as const,
				days: [
					{
						day: '2024-01-10',
						tempMaxC: 36.1,
						tempMinC: 22,
						precipMm: 0,
						weatherCode: 0,
						humidityMean: 40
					}
				]
			}))
		};

		const result = await runWeatherImportOnce(
			{ enabled: true },
			{
				client,
				sleep: async () => {},
				now: () => now
			}
		);
		expect(result.outcome).toBe('ran');
		expect(result.fetched).toBe(1);
		const row = db.select().from(weatherDays).get();
		expect(row?.tempMaxC).toBe(36.1);
		expect(row?.status).toBe('ok');
		expect(listPendingWeatherDays(10, now)).toEqual([]);
		expect(weatherImportStatus({ enabled: true }, now).cachedOk).toBe(1);
	});

	it('refuses when disabled', async () => {
		const result = await runWeatherImportOnce(
			{ enabled: false },
			{
				client: { fetchDaily: async () => ({ ok: true, days: [] }) },
				sleep: async () => {},
				now: () => Date.now()
			}
		);
		expect(result.outcome).toBe('disabled');
	});
});
