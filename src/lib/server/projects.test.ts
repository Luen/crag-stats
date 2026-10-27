import { describe, expect, it } from 'vitest';
import {
	classifyRouteProject,
	isLikelyIndoorRoute,
	isRecentlySent,
	isTouchedWithin,
	rankDashboardProjects,
	summarizeRouteAscents,
	triesFromAscent
} from './projects';

describe('classifyRouteProject', () => {
	it('marks open when there are unsent attempts and no sends', () => {
		expect(
			classifyRouteProject({ nonSendCount: 1, sendCount: 0, hadAttemptsBeforeSend: false })
		).toBe('open');
		expect(
			classifyRouteProject({ nonSendCount: 3, sendCount: 0, hadAttemptsBeforeSend: false })
		).toBe('open');
	});

	it('marks sent when fought then sent', () => {
		expect(
			classifyRouteProject({ nonSendCount: 2, sendCount: 1, hadAttemptsBeforeSend: true })
		).toBe('sent');
	});

	it('never treats first-go onsight/flash as a project', () => {
		expect(
			classifyRouteProject({ nonSendCount: 0, sendCount: 1, hadAttemptsBeforeSend: false })
		).toBe('none');
		expect(
			classifyRouteProject({ nonSendCount: 0, sendCount: 2, hadAttemptsBeforeSend: false })
		).toBe('none');
	});

	it('still rejects first-go sends even if fight flag is wrongly set', () => {
		expect(
			classifyRouteProject({ nonSendCount: 0, sendCount: 1, hadAttemptsBeforeSend: true })
		).toBe('none');
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

	it('opens a project from a single attempt', () => {
		const stats = summarizeRouteAscents([
			{ ascentDate: '2026-04-01', isSend: false, isAttempt: true, numberAttempts: null }
		]);
		expect(classifyRouteProject(stats)).toBe('open');
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
