import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { ascents, projectOverrides, routes } from './db/schema';
import { wipeAllData } from './wipe';
import { reconcileProviderAscents } from './ingest';
import { getProjectOverrides, projectDecision, setProjectOverride } from './projectOverrides';
import {
	countActiveProjects,
	listActiveProjects,
	listDashboardProjects,
	refreshProjects
} from './projects';

beforeEach(() => wipeAllData());
const now = new Date('2026-11-06T12:00:00Z');

function seed(externalId = 'manual-route', day = '2020-01-01', send = false, indoor = false) {
	const route = db
		.insert(routes)
		.values({
			provider: 'thecrag',
			externalId,
			name: indoor ? 'Indoor gym route' : 'Manual route',
			gearStyle: 'Sport',
			updatedAt: now.toISOString()
		})
		.returning()
		.get();
	db.insert(ascents)
		.values({
			provider: 'thecrag',
			externalId: `${externalId}-attempt`,
			routeId: route.id,
			ascentDate: day,
			isSend: send,
			updatedAt: now.toISOString()
		})
		.run();
	return route.id;
}

describe('owner project selection', () => {
	it('pins a single old logged session through refresh and applies to list, dashboard and count', () => {
		const id = seed();
		refreshProjects(now);
		expect(listActiveProjects(now).workingOn).toHaveLength(0);
		expect(setProjectOverride('thecrag', 'manual-route', 'include')).toBe(true);
		refreshProjects(now);
		refreshProjects(now);
		expect(listActiveProjects(now).workingOn[0]).toMatchObject({
			routeId: id,
			selection: 'include',
			status: 'open',
			sessionCount: 1,
			tryCount: 1
		});
		expect(listDashboardProjects(3, now)).toHaveLength(1);
		expect(countActiveProjects(now)).toBe(1);
		setProjectOverride('thecrag', 'manual-route', 'exclude');
		refreshProjects(now);
		expect(listActiveProjects(now).workingOn).toHaveLength(0);
		expect(listDashboardProjects(3, now)).toHaveLength(0);
		expect(countActiveProjects(now)).toBe(0);
		setProjectOverride('thecrag', 'manual-route', 'auto');
		refreshProjects(now);
		expect(getProjectOverrides().size).toBe(0);
		expect(listActiveProjects(now).workingOn).toHaveLength(0);
	});
	it('dismisses an auto-detected route and restores automatic classification', () => {
		const id = seed('auto-route', '2026-11-01');
		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: 'second-attempt',
				routeId: id,
				ascentDate: '2026-11-02',
				updatedAt: now.toISOString()
			})
			.run();
		refreshProjects(now);
		expect(countActiveProjects(now)).toBe(1);
		setProjectOverride('thecrag', 'auto-route', 'exclude');
		refreshProjects(now);
		expect(countActiveProjects(now)).toBe(0);
		setProjectOverride('thecrag', 'auto-route', 'auto');
		refreshProjects(now);
		expect(countActiveProjects(now)).toBe(1);
	});
	it('keeps stable provider-route intent across upstream prune/reappearance, and wipe clears it', () => {
		seed();
		setProjectOverride('thecrag', 'manual-route', 'exclude');
		reconcileProviderAscents('thecrag', [], { expectedCount: 0 });
		expect(projectDecision(getProjectOverrides(), 'thecrag', 'manual-route')).toBe('exclude');
		seed();
		refreshProjects(now);
		expect(countActiveProjects(now)).toBe(0);
		wipeAllData();
		expect(db.select().from(projectOverrides).all()).toEqual([]);
	});
	it('uses real sends for status and exposes old manually selected sends separately', () => {
		seed('sent-route', '2020-01-01', true);
		setProjectOverride('thecrag', 'sent-route', 'include');
		refreshProjects(now);
		const result = listActiveProjects(now);
		expect(result.workingOn).toHaveLength(0);
		expect(result.recentlySent).toHaveLength(0);
		expect(result.earlierSelected[0]).toMatchObject({
			status: 'sent',
			selection: 'include',
			tryCount: 0
		});
	});
	it('rejects unknown, unlogged and indoor inclusion without creating overrides', () => {
		seed('indoor-route', '2026-11-01', false, true);
		expect(setProjectOverride('thecrag', 'unknown', 'include')).toBe(false);
		expect(setProjectOverride('thecrag', 'indoor-route', 'include')).toBe(false);
		db.insert(routes)
			.values({
				provider: 'thecrag',
				externalId: 'unlogged',
				name: 'Unlogged',
				updatedAt: now.toISOString()
			})
			.run();
		expect(setProjectOverride('thecrag', 'unlogged', 'include')).toBe(false);
		expect(getProjectOverrides().size).toBe(0);
	});
});
