import { beforeEach, expect, it } from 'vitest';
import { wipeAllData } from './analytics';
import { db } from './db';
import { ascents, routes } from './db/schema';
import { upsertAscents } from './ingest';
import { mapTheCragCsvRow } from './providers/thecrag/csv';
import { repairGradesFromRawJson } from './repairGrades';

beforeEach(() => {
	wipeAllData();
});

it('repairs fake V9 on stored CSV raw_json for Australian bare boulder 9', () => {
	const wrong = mapTheCragCsvRow({
		'Ascent ID': '2631769824',
		'Route ID': '3',
		'Route Name': 'Upendi',
		'Ascent Type': 'Repeat',
		'Route Grade': '9',
		'Route Gear Style': 'Boulder',
		Country: 'Australia',
		'Crag Path': 'Australia - Queensland - Magnetic Island',
		'Ascent Date': '2019-02-23'
	})!;
	// Simulate the pre-fix parse: bare boulder digits stored as fake V9.
	wrong.route.gradeScore = 9;
	wrong.route.gradeSystem = 'v_scale';
	wrong.effectiveGradeScore = 9;
	wrong.effectiveGradeRaw = 'V9';
	upsertAscents([wrong]);

	const before = db.select().from(routes).get();
	expect(before?.gradeScore).toBe(9);

	const result = repairGradesFromRawJson();
	expect(result.routes).toBeGreaterThan(0);

	const route = db.select().from(routes).get();
	expect(route?.gradeScore).toBe(-0.7);
	const ascent = db.select().from(ascents).get();
	expect(ascent?.effectiveGradeScore).toBe(-0.7);
	expect(ascent?.effectiveGradeRaw).not.toMatch(/^V9$/i);
});
