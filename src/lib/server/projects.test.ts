import { upsertAscents } from './ingest';
import { wipeAllData } from './analytics';
import { refreshProjects, listProjects, listDashboardProjects } from './projects';
import { beforeEach, describe, expect, it } from 'vitest';
import {
	classifyRouteProject,
	countTouched,
	isLikelyIndoorRoute,
	isRecentlySent,
	isTouchedWithin,
	isProvisionalGradeRange,
	isTheCragProjectFlag,
	isUngradedRoute,
	rankDashboardProjects,
	summarizeRouteAscents,
	triesFromAscent
} from './projects';

describe('isTheCragProjectFlag', () => {
	it('is true only when route info stored is_project = 1', () => {
		expect(isTheCragProjectFlag(1)).toBe(true);
		expect(isTheCragProjectFlag(0)).toBe(false);
		expect(isTheCragProjectFlag(null)).toBe(false);
		expect(isTheCragProjectFlag(undefined)).toBe(false);
	});
});

describe('isProvisionalGradeRange', () => {
	it('flags multi-grade spans but not adjacent half-grades', () => {
		expect(isProvisionalGradeRange('21-23')).toBe(true);
		expect(isProvisionalGradeRange('21–23')).toBe(true);
		expect(isProvisionalGradeRange('V1-3')).toBe(true);
		expect(isProvisionalGradeRange('V1-V3')).toBe(true);
		expect(isProvisionalGradeRange('V1/3')).toBe(true);
		expect(isProvisionalGradeRange('V1/2')).toBe(false);
		expect(isProvisionalGradeRange('V5/6')).toBe(false);
		expect(isProvisionalGradeRange('22-23')).toBe(false);
		expect(isProvisionalGradeRange('24')).toBe(false);
		expect(isProvisionalGradeRange('HVS 5a')).toBe(false);
	});
});

describe('isUngradedRoute', () => {
	it('flags routes theCrag has no grade for, and literal project grades', () => {
		expect(isUngradedRoute(null, null)).toBe(true);
		expect(isUngradedRoute(null, '  ')).toBe(true);
		expect(isUngradedRoute(null, 'Project')).toBe(true);
		expect(isUngradedRoute(null, 'open proj')).toBe(true);
		expect(isUngradedRoute(24, '24')).toBe(false);
		// Unparsed but real grades aren't projects.
		expect(isUngradedRoute(null, 'HVS 5a')).toBe(false);
	});

	it('treats provisional multi-grade spans as New route? even with a midpoint score', () => {
		expect(isUngradedRoute(22, '21-23')).toBe(true);
		expect(isUngradedRoute(2, 'V1-3')).toBe(true);
		expect(isUngradedRoute(1.5, 'V1/2')).toBe(false);
	});
});

describe('isRecentlySent', () => {
	const now = new Date('2026-10-27T12:00:00Z');

	it('includes sends within ~31 days', () => {
		expect(isRecentlySent('2026-10-01', now)).toBe(true);
		expect(isRecentlySent('2026-09-26', now)).toBe(true);
	});

	it('excludes older sent projects from the shelf', () => {
		expect(isRecentlySent('2026-09-01', now)).toBe(false);
		expect(isRecentlySent('2025-10-27', now)).toBe(false);
	});

	it('rejects missing or invalid dates', () => {
		expect(isRecentlySent(null, now)).toBe(false);
		expect(isRecentlySent('', now)).toBe(false);
		expect(isRecentlySent('not-a-date', now)).toBe(false);
	});
});

describe('isTouchedWithin', () => {
	const now = new Date('2026-10-27T12:00:00Z');

	it('keeps projects touched within a year', () => {
		expect(isTouchedWithin('2026-01-01', now)).toBe(true);
		expect(isTouchedWithin('2025-10-28', now)).toBe(true);
	});

	it('drops projects untouched for over a year', () => {
		expect(isTouchedWithin('2025-10-26', now)).toBe(false);
		expect(isTouchedWithin('2024-06-01', now)).toBe(false);
	});

	it('rejects missing or invalid dates', () => {
		expect(isTouchedWithin(null, now)).toBe(false);
		expect(isTouchedWithin('', now)).toBe(false);
		expect(isTouchedWithin('2018-00-00', now)).toBe(false);
	});
});

describe('triesFromAscent', () => {
	it('sums numberAttempts when present, else 1 per non-send', () => {
		expect(triesFromAscent(4, false)).toBe(4);
		expect(triesFromAscent(0, false)).toBe(1);
		expect(triesFromAscent(null, false)).toBe(1);
	});

	it('ignores sends', () => {
		expect(triesFromAscent(3, true)).toBe(0);
	});
});

describe('summarizeRouteAscents', () => {
	it('detects fight-then-send and counts sessions/tries', () => {
		const stats = summarizeRouteAscents([
			{ ascentDate: '2026-01-01', isSend: false, isAttempt: true, numberAttempts: 2 },
			{ ascentDate: '2026-01-08', isSend: false, isAttempt: true, numberAttempts: null },
			{ ascentDate: '2026-01-15', isSend: true, isAttempt: false, numberAttempts: 1 }
		]);
		expect(stats.nonSendCount).toBe(2);
		expect(stats.sendCount).toBe(1);
		expect(stats.tryCount).toBe(3);
		expect(stats.sessionCount).toBe(3);
		expect(stats.hadAttemptsBeforeSend).toBe(true);
		expect(stats.sentAt).toBe('2026-01-15');
		expect(classifyRouteProject(stats)).toBe('sent');
	});

	it('does not project a lone onsight', () => {
		const stats = summarizeRouteAscents([
			{ ascentDate: '2026-03-01', isSend: true, isAttempt: false, numberAttempts: 1 }
		]);
		expect(stats.hadAttemptsBeforeSend).toBe(false);
		expect(classifyRouteProject(stats)).toBe('none');
	});

	it('waits after a single attempt', () => {
		const stats = summarizeRouteAscents([
			{ ascentDate: '2026-04-01', isSend: false, isAttempt: true, numberAttempts: null }
		]);
		expect(classifyRouteProject(stats)).toBe('none');
		expect(stats.tryCount).toBe(1);
		expect(stats.sessionCount).toBe(1);
	});
});

describe('rankDashboardProjects', () => {
	it('prefers most sessions, then tries, and fills from recent sends', () => {
		const open = [
			{ id: 1, sessionCount: 2, tryCount: 5, lastAttemptAt: '2026-01-01' },
			{ id: 2, sessionCount: 5, tryCount: 5, lastAttemptAt: '2025-12-01' },
			{ id: 3, sessionCount: 5, tryCount: 9, lastAttemptAt: '2025-11-01' }
		];
		expect(rankDashboardProjects(open, [], 2).map((p) => p.id)).toEqual([3, 2]);
		expect(
			rankDashboardProjects(
				[{ id: 1, sessionCount: 1, tryCount: 1, lastAttemptAt: '2026-01-01' }],
				[
					{ id: 9, sessionCount: 4, tryCount: 4, lastAttemptAt: '2026-02-01' },
					{ id: 8, sessionCount: 3, tryCount: 3, lastAttemptAt: '2026-01-15' }
				],
				3
			).map((p) => p.id)
		).toEqual([1, 9, 8]);
	});
});

describe('isLikelyIndoorRoute', () => {
	it('flags gym/indoor gear styles and names', () => {
		expect(isLikelyIndoorRoute({ gearStyle: 'Gym' })).toBe(true);
		expect(isLikelyIndoorRoute({ cragName: 'City Climbing Gym' })).toBe(true);
		expect(isLikelyIndoorRoute({ name: 'Indoor warm-up' })).toBe(true);
	});

	it('leaves outdoor routes alone', () => {
		expect(isLikelyIndoorRoute({ gearStyle: 'Sport', cragName: 'El Chorro', name: 'Hades' })).toBe(
			false
		);
	});
});

describe('countTouched', () => {
	it('matches the working-on rule (touched within a year)', () => {
		const now = new Date('2026-10-27T00:00:00Z');
		const rows = [
			{ lastAttemptAt: '2026-10-01' },
			{ lastAttemptAt: '2025-11-01' },
			{ lastAttemptAt: '2024-01-01' },
			{ lastAttemptAt: null }
		];
		expect(countTouched(rows, now)).toBe(2);
		expect(countTouched(rows, now)).toBe(
			rows.filter((r) => isTouchedWithin(r.lastAttemptAt, now)).length
		);
	});
});

describe('project thresholds', () => {
	const attempt = (ascentDate: string | null, numberAttempts: number | null = null) => ({
		ascentDate,
		numberAttempts,
		isSend: false,
		isAttempt: true
	});
	const send = (ascentDate: string, numberAttempts = 1) => ({
		ascentDate,
		numberAttempts,
		isSend: true,
		isAttempt: false
	});
	const classify = (rows: Parameters<typeof summarizeRouteAscents>[0]) =>
		classifyRouteProject(summarizeRouteAscents(rows));
	it('requires two valid days for an open project', () => {
		expect(classify([attempt('2026-01-01', 10), attempt('2026-01-01')])).toBe('none');
		expect(classify([attempt('2026-01-01'), attempt('2026-01-02')])).toBe('open');
		expect(classify([attempt('2026-01-01'), attempt('2026-02-30'), attempt(null)])).toBe('none');
	});
	it('recognises a send on the second session', () => {
		expect(classify([send('2026-01-02'), attempt('2026-01-01')])).toBe('sent');
	});
	it('requires two failed tries for a same-day completed project', () => {
		expect(classify([attempt('2026-01-01'), send('2026-01-01')])).toBe('none');
		expect(classify([attempt('2026-01-01', 2), send('2026-01-01')])).toBe('sent');
		expect(classify([attempt('2026-01-01'), attempt('2026-01-01'), send('2026-01-01')])).toBe(
			'sent'
		);
		expect(classify([send('2026-01-01', 3)])).toBe('sent');
		expect(classify([send('2026-01-01', 2)])).toBe('none');
		expect(classify([attempt('2026-01-01'), send('2026-01-01', 2)])).toBe('none');
	});
	it('ignores later attempts and repeats when classifying the first send', () => {
		expect(classify([send('2026-01-01'), attempt('2026-01-02', 4), send('2026-01-03', 5)])).toBe(
			'none'
		);
		expect(classify([attempt(null, 10), send('2026-01-01')])).toBe('none');
	});
	it('keeps timestamps on their written calendar day', () => {
		expect(
			classify([attempt('2026-01-01T01:00:00+14:00'), attempt('2026-01-01T23:00:00-10:00')])
		).toBe('none');
	});
});

it('does not count timestamped work after the first same-day send', () => {
	const stats = summarizeRouteAscents([
		{ ascentDate: '2026-01-01T09:00:00Z', isSend: true, isAttempt: false, numberAttempts: 1 },
		{ ascentDate: '2026-01-01T10:00:00Z', isSend: false, isAttempt: true, numberAttempts: 3 }
	]);
	expect(classifyRouteProject(stats)).toBe('none');
	expect(stats.triesBeforeSend).toBe(0);
});

describe('project session counts in list and dashboard', () => {
	beforeEach(() => wipeAllData());
	it('counts only valid written calendar days in project cards and ranking', () => {
		upsertAscents(
			['2026-10-29', '2026-10-30', '2026-02-30', '0000-01-01', null].map((ascentDate, i) => ({
				provider: 'thecrag',
				externalId: `valid-project-${i}`,
				ascentDate,
				isSend: false,
				isAttempt: true,
				route: {
					provider: 'thecrag',
					externalId: 'valid-project-route',
					name: 'Synthetic project',
					gearStyle: 'Sport'
				}
			}))
		);
		refreshProjects(new Date('2026-10-31T12:00:00Z'));
		expect(listProjects('open')[0]?.sessionCount).toBe(2);
		expect(listDashboardProjects(3, new Date('2026-10-31T12:00:00Z'))[0]?.sessionCount).toBe(2);
	});
});

it('uses known times before stored ascent order for the first send on a written day', () => {
	const rows = [
		{
			ascentId: 1,
			ascentDate: '2026-01-01T08:00:00Z',
			isSend: true,
			isAttempt: false,
			numberAttempts: 1
		},
		{
			ascentId: 2,
			ascentDate: '2026-01-01T09:00:00+02:00',
			isSend: true,
			isAttempt: false,
			numberAttempts: 3
		}
	];
	const stats = summarizeRouteAscents(rows);
	expect(stats.sentAt).toBe('2026-01-01T09:00:00+02:00');
	expect(classifyRouteProject(stats)).toBe('sent');
	expect(classifyRouteProject(summarizeRouteAscents([...rows].reverse()))).toBe('sent');
});

it('uses stable ascent IDs for date-only send ties and keeps ambiguous same-day work', () => {
	const first = {
		ascentId: 1,
		ascentDate: '2026-01-01',
		isSend: true,
		isAttempt: false,
		numberAttempts: 1
	};
	const repeat = { ...first, ascentId: 2, numberAttempts: 5 };
	expect(classifyRouteProject(summarizeRouteAscents([repeat, first]))).toBe('none');
	const attempt = { ascentDate: '2026-01-01', isSend: false, isAttempt: true, numberAttempts: 2 };
	expect(
		classifyRouteProject(
			summarizeRouteAscents([attempt, { ...first, ascentDate: '2026-01-01T09:00:00Z' }])
		)
	).toBe('sent');
	const before = { ...attempt, ascentDate: '2026-01-01T08:00:00Z' };
	expect(
		classifyRouteProject(
			summarizeRouteAscents([before, { ...first, ascentDate: '2026-01-01T09:00:00Z' }])
		)
	).toBe('sent');
});

it('keeps mixed timed and date-only send ordering independent of input order', () => {
	const timedFirst = {
		ascentId: 3,
		ascentDate: '2026-01-01T08:00:00Z',
		isSend: true,
		isAttempt: false,
		numberAttempts: 1
	};
	const dateOnly = {
		ascentId: 2,
		ascentDate: '2026-01-01',
		isSend: true,
		isAttempt: false,
		numberAttempts: 3
	};
	const timedLater = {
		ascentId: 1,
		ascentDate: '2026-01-01T09:00:00Z',
		isSend: true,
		isAttempt: false,
		numberAttempts: 1
	};
	for (const rows of [
		[timedFirst, dateOnly, timedLater],
		[timedLater, timedFirst, dateOnly],
		[dateOnly, timedLater, timedFirst]
	]) {
		const stats = summarizeRouteAscents(rows);
		expect(stats.sentAt).toBe('2026-01-01');
		expect(classifyRouteProject(stats)).toBe('sent');
	}
});

it('orders known send and attempt timestamps across different written dates and offsets', () => {
	const first = {
		ascentId: 2,
		ascentDate: '2026-01-02T08:00:00+02:00',
		isSend: true,
		isAttempt: false,
		numberAttempts: 1
	};
	const later = {
		ascentId: 1,
		ascentDate: '2026-01-01T23:00:00-10:00',
		isSend: false,
		isAttempt: true,
		numberAttempts: 3
	};
	expect(classifyRouteProject(summarizeRouteAscents([later, first]))).toBe('none');
	expect(summarizeRouteAscents([later, first]).triesBeforeSend).toBe(0);
	const result = summarizeRouteAscents([
		{ ...later, isSend: true, isAttempt: false, numberAttempts: 1 },
		{ ...first, numberAttempts: 3 }
	]);
	expect(result.sentAt).toBe(first.ascentDate);
	expect(classifyRouteProject(result)).toBe('sent');
});

it('orders different date-only send days before stored ascent IDs', () => {
	const first = {
		ascentId: 2,
		ascentDate: '2026-01-01',
		isSend: true,
		isAttempt: false,
		numberAttempts: 1
	};
	const later = { ...first, ascentId: 1, ascentDate: '2026-01-02', numberAttempts: 5 };
	expect(classifyRouteProject(summarizeRouteAscents([later, first]))).toBe('none');
	expect(summarizeRouteAscents([later, first]).sentAt).toBe(first.ascentDate);
});
