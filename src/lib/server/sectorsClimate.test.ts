import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { routes, weatherDays } from './db/schema';
import { upsertAscents } from './ingest';
import { listSectors } from './sectors';
import { wipeAllData } from './analytics';

describe('visit climate on sectors (#278)', () => {
	beforeEach(() => wipeAllData());

	function seed(crag: string, days: number, gym = false) {
		for (let i = 1; i <= days; i++) {
			const id = `${crag}-${i}`;
			upsertAscents([
				{
					provider: 'thecrag',
					externalId: 'a-' + id,
					ascentDate: `2025-02-${String(i).padStart(2, '0')}`,
					isSend: true,
					isAttempt: false,
					route: {
						provider: 'thecrag',
						externalId: id,
						name: 'R ' + id,
						cragName: crag,
						gearStyle: gym ? 'Gym' : 'Sport'
					}
				}
			]);
			db.update(routes).set({ lat: -37.1, lon: 142.5 }).where(eq(routes.externalId, id)).run();
			db.insert(weatherDays)
				.values({
					latKey: -37.1,
					lonKey: 142.5,
					day: `2025-02-${String(i).padStart(2, '0')}`,
					tempMaxC: 20 + i,
					tempMinC: 10,
					precipMm: 0,
					weatherCode: 1,
					status: 'ok',
					fetchedAt: '2026-01-01T00:00:00Z'
				})
				.onConflictDoNothing()
				.run();
		}
	}

	it('summarises cached visit days once a crag has five of them', () => {
		seed('Arapiles', 6);
		const crag = listSectors().find((c) => c.cragName === 'Arapiles');
		expect(crag?.visitClimate?.days).toBe(6);
		expect(crag?.visitClimate?.avgHighC).toBe(24); // mean(21..26) = 23.5 -> 24
		expect(crag?.visitClimate?.rainPct).toBe(0);
	});

	it('shows nothing below five days, for indoor crags, or without a weather cache', () => {
		seed('Small crag', 4);
		expect(listSectors().find((c) => c.cragName === 'Small crag')?.visitClimate).toBeNull();
		wipeAllData();
		seed('The Gym', 6, true);
		const gym = listSectors().find((c) => c.cragName === 'The Gym');
		expect(gym?.visitClimate).toBeNull();
		db.delete(weatherDays).run();
		seed('Arapiles', 6);
		db.delete(weatherDays).run();
		expect(listSectors().every((c) => c.visitClimate == null)).toBe(true);
	});
});
