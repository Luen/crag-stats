import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { routes } from './db/schema';
import { getDashboardStats, wipeAllData } from './analytics';
import { setFirstAscent } from './firstAscents';
import { upsertAscents } from './ingest';
import { mapAscent } from './providers/thecrag/api';
import { repairGradesFromRawJson } from './repairGrades';

beforeEach(() => wipeAllData());
describe('grade-system evidence survives repair (#124)', () => {
	it.each([
		['BLDV', '5', 5, 'V5'],
		[undefined, '5', 5, 'V5'],
		['AU', '9', -0.7, 'VB+']
	])('preserves %s grade %s', (gradeSystem, grade, score, label) => {
		const mapped = mapAscent({
			id: 99001,
			date: '2026-01-01',
			gradeSystem,
			tick: { name: 'Tick' },
			route: {
				id: 99001,
				name: 'Synthetic boulder',
				grade,
				style: 'Boulder',
				ancestors: { country: { name: 'Australia' } }
			}
		})!;
		upsertAscents([mapped]);
		// Simulate an older cache with the original API JSON still available.
		db.update(routes)
			.set({ gradeScore: Number(grade) })
			.where(eq(routes.externalId, '99001'))
			.run();
		repairGradesFromRawJson();
		expect(db.select().from(routes).get()!.gradeScore).toBe(score);
		setFirstAscent('thecrag', '99001', 'FA');
		expect(getDashboardStats().firstAscents.recent[0].gradeLabel).toBe(label);
	});
	it('does not reinterpret an ambiguous Australian CSV grade as AU', () => {
		upsertAscents([
			{
				provider: 'thecrag',
				externalId: 'csv-a',
				ascentDate: '2026-01-01',
				isSend: true,
				isAttempt: false,
				route: {
					provider: 'thecrag',
					externalId: 'csv-r',
					name: 'CSV V5',
					gradeRaw: '5',
					gradeScore: 5,
					gradeSystem: 'v_scale',
					gearStyle: 'Boulder',
					country: 'Australia'
				}
			}
		]);
		repairGradesFromRawJson();
		expect(db.select().from(routes).get()!.gradeScore).toBe(5);
	});
});
