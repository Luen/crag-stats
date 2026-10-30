import { it, expect } from 'vitest';
import { upsertAscents } from './ingest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
it('keeps route Sport separate from ascent Trad through ingestion and badge evaluation', () => {
	wipeAllData();
	upsertAscents([
		{
			provider: 'thecrag',
			externalId: 'greenpoint-fixture',
			ascentDate: '2025-01-01',
			isSend: true,
			isAttempt: false,
			tickType: 'Red point',
			ascentGearStyle: 'Trad',
			route: {
				provider: 'thecrag',
				externalId: 'sport-fixture',
				name: 'Sport route on gear',
				gearStyle: 'Sport'
			}
		}
	]);
	const log = listLogbook().rows[0];
	expect(log.gearStyle).toBe('Sport');
	expect(log.ascentGearStyle).toBe('Trad');
	expect(getDashboardStats().badges.earned.find((b) => b.id === 'greenpoint')?.routeName).toBe(
		'Sport route on gear'
	);
});

it('maps documented Greenpoint labels through provider ingestion and cached repair', async () => {
	const { mapAscent } = await import('./providers/thecrag/api');
	const { repairGradesFromRawJson } = await import('./repairGrades');
	wipeAllData();
	// Minimal synthetic fixtures from the public tick/API documentation, with no user data.
	for (const [i, name] of ['Green point', 'Green point onsight', 'Green point flash'].entries()) {
		const mapped = mapAscent({
			id: 900 + i,
			date: `2025-02-0${i + 1}`,
			climbedGearStyle: 'Trad',
			tick: { name },
			route: { id: 800 + i, name: `Documented greenpoint ${i}`, style: 'Sport', grade: '18' }
		})!;
		expect(mapped.isSend).toBe(true);
		upsertAscents([mapped]);
	}
	repairGradesFromRawJson();
	for (const row of listLogbook().rows) {
		expect(row.gearStyle).toBe('Sport');
		expect(row.ascentGearStyle).toBe('Trad');
	}
	expect(getDashboardStats().badges.earned.find((b) => b.id === 'greenpoint')).toMatchObject({
		date: '2025-02-01',
		routeName: 'Documented greenpoint 0'
	});
});
