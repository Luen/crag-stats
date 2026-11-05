import { expect, it } from 'vitest';
import { buildPerformanceBaseline, type PerformanceBaselineRow } from './performanceBaseline';

const row = (over: Partial<PerformanceBaselineRow> = {}): PerformanceBaselineRow => ({
	ascentDate: '2026-01-01',
	isSend: true,
	gearStyle: 'Sport',
	gradeSystem: 'ewbank',
	gradeScore: 24,
	...over
});

it('uses effective scores, separates style and scale, and excludes invalid/unsent rows', () => {
	const rows = [
		row({ effectiveGradeScore: 21, gradeScore: 30 }),
		row({ gearStyle: 'Trad', gradeScore: 18 }),
		row({ gearStyle: 'Deep water solo', gradeSystem: 'v_scale', gradeScore: 6 }),
		row({ gearStyle: 'Deep water solo', gradeSystem: 'ewbank', gradeScore: 25 }),
		row({ gradeScore: 40, isSend: false }),
		row({ gradeScore: 40, ascentDate: '2026-02-30' }),
		row({ gradeScore: Infinity })
	];
	const ref = buildPerformanceBaseline(rows, () => true);
	const query = row({ ascentDate: '2026-02-01' });
	expect(ref(query)).toBe(21);
	expect(ref({ ...query, gearStyle: 'Trad' })).toBe(18);
	expect(ref({ ...query, gearStyle: 'Deep water solo', gradeSystem: 'v_scale' })).toBe(6);
	expect(ref({ ...query, gearStyle: 'Deep water solo' })).toBe(25);
	expect(ref({ ...query, gearStyle: 'Boulder', gradeSystem: 'v_scale' })).toBeNull();
});

it('includes the 365th prior day, excludes older and same-day sends, and supports unordered queries', () => {
	const ref = buildPerformanceBaseline(
		[
			row({ ascentDate: '2026-01-01', gradeScore: 40 }),
			row({ ascentDate: '2025-01-01', gradeScore: 24 }),
			row({ ascentDate: '2024-12-31', gradeScore: 30 }),
			row({ ascentDate: '2025-01-01', gradeScore: 25 })
		],
		() => true
	);
	expect(ref(row({ ascentDate: '2026-01-01' }))).toBe(25);
	expect(ref(row({ ascentDate: '2025-01-01' }))).toBe(30);
	expect(ref(row({ ascentDate: '2024-12-31' }))).toBeNull();
	expect(ref(row({ ascentDate: '2026-01-02' }))).toBe(40);
	expect(ref(row({ ascentDate: '2026-02-30' }))).toBeNull();
});

it('makes eligibility explicit without requiring tags or weather on reference sends', () => {
	const rows = [row({ gradeScore: 24 }), { ...row({ gradeScore: 30 }), outdoor: false }];
	const query = row({ ascentDate: '2026-02-01' });
	expect(buildPerformanceBaseline(rows, () => true)(query)).toBe(30);
	expect(
		buildPerformanceBaseline(rows, (r) => !('outdoor' in r) || r.outdoor !== false)(query)
	).toBe(24);
});

it('matches a direct reference scan across overlapping rolling windows and arbitrary query order', () => {
	const date = (n: number) => new Date(Date.UTC(2024, 0, 1 + n)).toISOString().slice(0, 10);
	const rows = Array.from({ length: 600 }, (_, i) =>
		row({
			ascentDate: date((i * 17) % 800),
			gradeScore: 10 + ((i * 13) % 25),
			isSend: i % 4 !== 0
		})
	);
	const ref = buildPerformanceBaseline(rows, () => true);
	for (let i = 0; i < 80; i++) {
		const day = (i * 23) % 900;
		const scores = rows
			.filter((r) => r.isSend && r.ascentDate! >= date(day - 365) && r.ascentDate! < date(day))
			.map((r) => r.gradeScore!);
		expect(ref(row({ ascentDate: date(day) }))).toBe(scores.length ? Math.max(...scores) : null);
	}
});
