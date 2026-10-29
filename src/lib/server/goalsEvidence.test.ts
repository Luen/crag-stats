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
	expect(goal.progressPct).toBe(45);
	expect(goal.progressLabel).toContain('1/2 at 22');
	expect(goal.progressLabel).toContain('0/4 at 21');
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
