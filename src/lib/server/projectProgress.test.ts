import { describe, expect, it } from 'vitest';
import { projectProgress, type ProjectProgressRow, type ProjectTarget } from './projectProgress';

const target: ProjectTarget = {
	routeId: 1,
	gradeScore: 23,
	gradeSystem: 'ewbank',
	gearStyle: 'Sport'
};
const row = (
	routeId: number,
	day: string | null,
	send = false,
	tries = 1,
	score = 23
): ProjectProgressRow => ({
	ascentId: routeId * 100 + Number(day?.slice(8, 10) || 0),
	routeId,
	ascentDate: day,
	isSend: send,
	isAttempt: !send,
	numberAttempts: tries,
	effectiveGradeScore: score,
	gradeScore: score,
	gradeSystem: 'ewbank',
	gearStyle: 'Sport'
});

describe('project progression', () => {
	it('adds one point per additional project day after the 94-point base cap, with 100 reserved for a send', () => {
		const support = [
			row(2, '2026-09-01', true),
			...[3, 4].map((id) => row(id, '2026-09-01', true, 1, 22)),
			...[5, 6, 7, 8].map((id) => row(id, '2026-09-01', true, 1, 21))
		];
		const own = [1, 2, 3, 4, 5, 6].map((day) => row(1, `2026-10-0${day}`));
		const result = projectProgress(
			target,
			[...support, ...own, row(1, '2026-10-06')],
			'2026-11-06'
		);
		expect(result.sessions.map((s) => s.readiness)).toEqual([94, 95, 96, 97, 98, 99]);
		expect(result.pct).toBe(99);
		expect(
			projectProgress(target, [...support, ...own, row(1, '2026-10-07', true)], '2026-11-06').pct
		).toBe(100);
	});
	it('counts calendar-day sessions and deduplicates implied failed tries on a send', () => {
		const result = projectProgress(
			target,
			[
				row(1, '2026-10-01', false, 2),
				row(1, '2026-10-02', false, 2),
				row(1, '2026-10-02', true, 5)
			],
			'2026-11-06'
		);
		expect(result.stats).toMatchObject({ sessionCount: 2, tryCount: 4, sendCount: 1 });
		expect(result.sessions.map((s) => s.readiness)).toEqual([0, 100]);
		expect(result.sessions[1]).toMatchObject({ failedTries: 4, cumulativeTries: 4, sends: 1 });
		expect(result.pct).toBe(100);
		expect(result.forecast).toBeNull();
	});
	it('uses distinct supporting routes, effective grades, recency, style and scale; another send never completes this route', () => {
		const own = [row(1, '2026-10-01')];
		const support = [
			row(2, '2026-09-01', true, 1, 22),
			row(2, '2026-09-02', true, 1, 22),
			row(3, '2026-09-01', true, 1, 21)
		];
		const unrelated = [
			{ ...row(4, '2026-09-01', true, 1, 30), gearStyle: 'Trad' },
			{ ...row(5, '2026-09-01', true, 1, 30), gradeSystem: 'v_scale' },
			row(6, '2025-01-01', true, 1, 30),
			row(7, '2026-12-01', true, 1, 30),
			{ ...row(8, '2026-09-01', true, 1, 30), effectiveGradeScore: 20 }
		];
		const result = projectProgress(target, [...own, ...support, ...unrelated], '2026-11-06');
		expect(result.support).toEqual({ best: 22, n1: 1, n2: 1 });
		expect(result.pct).toBeLessThan(70);
		const sameGrade = projectProgress(target, [...own, row(9, '2026-09-01', true)], '2026-11-06');
		expect(sameGrade.pct).toBeLessThan(100);
		expect(sameGrade.horizon).toBe('Short-term');
	});
	it('does not leak later evidence into earlier session snapshots', () => {
		const result = projectProgress(
			target,
			[row(1, '2026-09-01'), row(1, '2026-10-01'), row(2, '2026-09-15', true, 1, 22)],
			'2026-11-06'
		);
		expect(result.sessions[0].readiness).toBe(0);
		expect(result.sessions[1].readiness).toBeGreaterThan(40);
	});
	it('supports V0 and unknown grades and excludes missing, impossible and future dates', () => {
		const entries = [
			row(1, '2026-10-01'),
			row(1, null),
			row(1, '2026-02-30'),
			row(1, '2027-01-01', true)
		];
		const result = projectProgress({ ...target, gradeScore: null }, entries, '2026-11-06');
		expect(result.pct).toBeNull();
		expect(result.excludedEntries).toBe(3);
		expect(result.stats.sessionCount).toBe(1);
		const v = projectProgress(
			{ ...target, gradeScore: 0, gradeSystem: 'v_scale' },
			entries,
			'2026-11-06'
		);
		expect(v.pct).not.toBeNull();
	});
	it('forecasts only with three longer completed projects and withholds outgrown samples', () => {
		const own = [row(1, '2026-10-01', false, 2)];
		const cohort = [2, 3, 4].flatMap((id) => [
			row(id, '2026-09-01', false, 3),
			row(id, '2026-09-02', false, 2),
			row(id, '2026-09-03', true)
		]);
		const result = projectProgress(target, [...own, ...cohort], '2026-11-06');
		expect(result.forecast).toMatchObject({ sampleCount: 3, sessions: [2, 2], tries: [4, 4] });
		expect(
			projectProgress(target, [...own, ...cohort.slice(0, 6)], '2026-11-06').forecast?.sessions
		).toBeNull();
		expect(
			projectProgress(target, [row(1, '2026-10-01', false, 20), ...cohort], '2026-11-06').forecast
				?.tries
		).toBeNull();
		const partial = cohort.map((r) => (r.isSend ? { ...r, effectiveGradeScore: 15 } : r));
		expect(projectProgress(target, [...own, ...partial], '2026-11-06').forecast?.sampleCount).toBe(
			0
		);
	});
});
