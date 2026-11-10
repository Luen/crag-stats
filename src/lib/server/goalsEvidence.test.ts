import { readFileSync } from 'node:fs';
import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./auth', () => ({ authScope: () => 'settings', isAuthEnabled: () => false }));
import { setAppSetting } from './appSettings';
import { wipeAllData } from './wipe';
import { upsertAscents } from './ingest';
import { createGoal, listGoals, setGoalGradeScale } from './goals';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { goals } from './db/schema';
import { parseTheCragCsv } from './providers/thecrag/csv';

const sample = parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv'))[0];

it('formats known scales in the selected systems and keeps custom titles', () => {
	setAppSetting('route_grade_system', 'french');
	setAppSetting('boulder_grade_system', 'font');
	upsertAscents([tick('display-goal', 'display-goal-route', 20)]);
	const goal = createGoal({
		kind: 'grade',
		title: 'Display goal',
		targetGradeScore: 21,
		year: 2026
	});
	expect(goal.targetLabel).toContain('Send ≥ 6b+');
	expect(goal.progressLabel).toContain('Best send 6b');
	expect(goal.title).toBe('Display goal');
	const boulder = createGoal({
		kind: 'grade',
		title: 'Send V5',
		targetGradeScore: 5,
		gradeScale: 'boulder',
		year: 2026
	});
	expect(boulder.targetLabel).toContain('Send ≥ 6C ·');
	expect(boulder.completed).toBe(false);
});

it('withholds unknown legacy evidence without changing local data, then uses the owner-selected scale', () => {
	upsertAscents([tick('legacy-route', 'legacy-route', 25)]);
	const saved = createGoal({ kind: 'grade', title: 'My V5 goal', targetGradeScore: 5 });
	db.update(goals)
		.set({ gradeScale: null, progressValue: '4', completed: true, achievedAt: '2026-01-01' })
		.where(eq(goals.id, saved.id))
		.run();
	const legacy = listGoals()[0];
	expect(legacy.title).toBe('My V5 goal');
	expect(legacy.progressPct).toBe(0);
	expect(legacy.progressLabel).toContain('Choose route or boulder');
	expect(db.select().from(goals).where(eq(goals.id, saved.id)).get()).toMatchObject({
		progressValue: '4',
		completed: true,
		achievedAt: '2026-01-01'
	});
	expect(setGoalGradeScale(saved.id, 'boulder', false)).toBe(true);
	expect(listGoals()[0]).toMatchObject({
		title: 'My V5 goal',
		completed: false,
		gradeScale: 'boulder'
	});
});

it('keeps route and V-scaled DWS sends, supporting buckets, attempts, and sessions separate', () => {
	const boulder = (id: string, score: number, send = true) => {
		const r = tick(id, id, score, { send });
		return { ...r, route: { ...r.route, gearStyle: 'DWS', gradeSystem: 'v_scale' } };
	};
	upsertAscents([
		tick('route-send', 'route-send', 25),
		tick('route-work', 'route-work', 25, { send: false }),
		boulder('support', 4),
		boulder('work', 4, false)
	]);
	const goal = createGoal({
		kind: 'grade',
		title: 'Boulder',
		targetGradeScore: 5,
		gradeScale: 'boulder'
	});
	expect(goal.completed).toBe(false);
	expect(goal.progressLabel).toContain('Best send V4');
	expect(goal.progressLabel).toContain('1/2 at V4');
	expect(goal.progressLabel).toContain('1 attempt');
	expect(goal.progressLabel).toContain('1 qualifying sessions');
	upsertAscents([boulder('target', 5)]);
	expect(listGoals()[0].completed).toBe(true);
	const routeGoal = createGoal({
		kind: 'grade',
		title: 'Route',
		targetGradeScore: 26,
		gradeScale: 'route'
	});
	expect(routeGoal.progressLabel).toContain('Best send 25');
	expect(routeGoal.progressLabel).toContain('1 attempt');
});

it.each([0, -1])(
	'supports a V-scale goal at %s and formats generated titles on every read',
	(target) => {
		const r = tick(`v-${target}`, `v-${target}`, target);
		upsertAscents([{ ...r, route: { ...r.route, gearStyle: 'Boulder', gradeSystem: 'v_scale' } }]);
		const goal = createGoal({
			kind: 'grade',
			title: 'Original suggested title',
			targetGradeScore: target,
			gradeScale: 'boulder',
			suggested: true
		});
		expect(goal.completed).toBe(true);
		expect(goal.progressPct).toBe(100);
		expect(goal.title).toContain(target === 0 ? 'V0' : 'VB');
		setAppSetting('boulder_grade_system', 'font');
		expect(listGoals()[0].title).not.toBe(goal.title);
		expect(db.select().from(goals).where(eq(goals.id, goal.id)).get()!.title).toBe(
			'Original suggested title'
		);
	}
);
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
beforeEach(() => {
	wipeAllData();
	setAppSetting('route_grade_system', 'ewbank');
	setAppSetting('boulder_grade_system', 'v_scale');
});

it('adds a point per additional qualifying day, deduplicating routes/ticks and excluding future days', () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-11-06T12:00:00Z'));
	try {
		upsertAscents([
			...[1, 2].map((n) => tick(`n1-${n}`, `n1-route-${n}`, 22)),
			...[1, 2, 3, 4].map((n) => tick(`n2-${n}`, `n2-route-${n}`, 21)),
			...Array.from({ length: 15 }, (_, n) =>
				tick(`effort-${n}`, `effort-route-${n}`, 23, { send: false, date: '2026-02-01' })
			)
		]);
		const goal = createGoal({
			kind: 'grade',
			title: 'Session credit',
			targetGradeScore: 23,
			year: 2026,
			venueScope: 'outdoor'
		});
		expect(goal.progressPct).toBe(94);
		upsertAscents([
			tick('day2', 'day2-route', 23, { send: false, date: '2026-02-02' }),
			tick('day2-again', 'another-route', 23, { send: false, date: '2026-02-02' }),
			tick('future', 'future-route', 23, { send: false, date: '2026-12-01' }),
			tick('easy', 'easy-route', 20, { send: false, date: '2026-02-03' }),
			tick('indoor', 'indoor-route', 23, { send: false, date: '2026-02-04', indoor: true })
		]);
		expect(listGoals()[0].progressPct).toBe(95);
		expect(listGoals()[0].progressLabel).toContain('2 qualifying sessions');
		upsertAscents(
			[3, 4, 5, 6, 7].map((day) =>
				tick(`day-${day}`, 'project-route', 23, { send: false, date: `2026-02-0${day}` })
			)
		);
		expect(listGoals()[0].progressPct).toBe(99);
		upsertAscents([tick('future-send-target', 'future-send-route', 23, { date: '2026-12-01' })]);
		expect(listGoals()[0].progressPct).toBe(99);
		upsertAscents([tick('send-target', 'target-route', 23, { date: '2026-02-08' })]);
		expect(listGoals()[0].progressPct).toBe(100);
	} finally {
		vi.useRealTimers();
	}
});

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
	expect(goal.progressLabel).toContain('1/2 at 23');
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

it('counts only classified attempts in the goal year and venue', () => {
	upsertAscents([
		tick('send', 'send-route', 22),
		{ ...tick('unknown', 'unknown-route', 25, { send: false }), isAttempt: false },
		tick('old-attempt', 'old-route', 25, { send: false, date: '2025-01-01' }),
		tick('indoor-attempt', 'gym-route', 25, { send: false, indoor: true }),
		tick('below-band', 'easy-route', 21, { send: false }),
		tick('working', 'project-route', 23, { send: false })
	]);
	const goal = createGoal({
		kind: 'grade',
		title: 'Scoped attempts',
		targetGradeScore: 23,
		year: 2026,
		venueScope: 'outdoor'
	});
	expect(goal.progressLabel).toContain('1 attempt on ≥22');
	expect(goal.progressPct).toBe(46.3);
});
