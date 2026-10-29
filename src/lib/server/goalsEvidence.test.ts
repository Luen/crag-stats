import { readFileSync } from 'node:fs';
import { beforeEach, expect, it } from 'vitest';
import { wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import { createGoal, listGoals } from './goals';
import { parseTheCragCsv } from './providers/thecrag/csv';

const sample = parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv'))[0];
function tick(
	id: string,
	routeId: string,
	score: number,
	options: { date?: string; send?: boolean; indoor?: boolean } = {}
) {
	return {
		...sample,
		externalId: id,
		route: {
			...sample.route,
			externalId: routeId,
			name: 'Synthetic route',
			gearStyle: 'Sport',
			gradeScore: score,
			cragName: options.indoor ? 'Synthetic Climbing Gym' : 'Synthetic crag'
		},
		ascentDate: options.date ?? '2026-01-01',
		isSend: options.send ?? true,
		isAttempt: options.send === false,
		effectiveGradeScore: score
	};
}
beforeEach(() => wipeAllData());

it('keeps fractional supporting sends in the target-relative bucket with scoped distinct-route evidence', () => {
	upsertAscents([
		tick('a1', 'r1', 22.6),
		tick('a2', 'r1', 22.6),
		tick('old', 'r2', 25, { date: '2025-01-01' }),
		tick('gym', 'r3', 25, { indoor: true }),
		tick('attempt', 'r4', 25, { send: false })
	]);
	const goal = createGoal({
		kind: 'grade',
		title: 'Synthetic target',
		targetGradeScore: 23,
		year: 2026,
		venueScope: 'outdoor'
	});
	expect(goal.completed).toBe(false);
	// Pyramid 1/2 at 22 (35+10) plus one outdoor attempt at ≥22 (short-term soft need 15 → +~1.3).
	expect(goal.progressPct).toBe(46.3);
	expect(goal.progressLabel).toContain('1/2 at 22');
	expect(goal.progressLabel).toContain('0/4 at 21');
	expect(goal.progressLabel).toContain('1 attempt on ≥22');
	upsertAscents([tick('a1', 'r1', 22), tick('a2', 'r1', 22)]);
	expect(listGoals()[0].progressPct).toBeLessThanOrEqual(goal.progressPct);
});

it('uses the same support ranges for fractional targets', () => {
	upsertAscents([tick('a1', 'r1', 23.1)]);
	const goal = createGoal({
		kind: 'grade',
		title: 'Synthetic fractional target',
		targetGradeScore: 23.5,
		year: 2026
	});
	expect(goal.completed).toBe(false);
	expect(goal.progressPct).toBe(45);
	expect(goal.progressLabel).toContain('1/2 at 22.5');
});

it('raises readiness on each near-target attempt and steps faster for short-term goals', () => {
	upsertAscents([
		tick('send22', 'r1', 22),
		tick('try1', 'r2', 23, { send: false, date: '2026-02-01' }),
		tick('try2', 'r2', 23, { send: false, date: '2026-02-02' })
	]);
	const short = createGoal({
		kind: 'grade',
		title: 'Short 23',
		targetGradeScore: 23,
		year: 2026
	});
	expect(short.progressPct).toBeGreaterThan(45);
	expect(short.progressLabel).toContain('2 attempts on ≥22');

	wipeAllData();
	upsertAscents([
		tick('send22', 'r1', 22),
		tick('try1', 'r2', 28, { send: false, date: '2026-02-01' }),
		tick('try2', 'r2', 28, { send: false, date: '2026-02-02' })
	]);
	const long = createGoal({
		kind: 'grade',
		title: 'Long 28',
		targetGradeScore: 28,
		year: 2026
	});
	// Same two attempts: long-haul soft need is larger, so the nudge is smaller than short-term.
	expect(long.progressPct).toBeLessThan(short.progressPct - 30);
	expect(long.progressLabel).toContain('Long-haul');
	expect(long.progressLabel).toContain('2 attempts on ≥27');
});
