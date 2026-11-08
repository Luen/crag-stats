import { beforeEach, expect, it, vi } from 'vitest';
import { wipeAllData } from './wipe';
import { getOrCreateSyncState, updateSyncState, upsertAscents } from './ingest';
import { db } from './db';
import { ascents } from './db/schema';
import { syncTheCragAll } from './providers/thecrag';
import { runTheCragSync } from './sync';
import type { CanonicalAscent } from './providers/types';
vi.mock('./env', () => ({
	env: () => 'synthetic-key',
	getTheCragSyncConfiguration: () => ({ mode: 'api', configured: true })
}));
vi.mock('./providers/thecrag', () => ({ syncTheCragAll: vi.fn() }));
vi.mock('./routeHistoryImport', () => ({ triggerRouteHistoryImport: vi.fn() }));
vi.mock('./weatherImport', () => ({ triggerWeatherImport: vi.fn() }));
const ascent = (id: string, route = id): CanonicalAscent => ({
	provider: 'thecrag',
	externalId: id,
	ascentDate: '2026-01-01',
	isSend: true,
	isAttempt: false,
	route: { provider: 'thecrag', externalId: route, name: 'Synthetic route', gearStyle: 'Sport' }
});
beforeEach(() => {
	wipeAllData();
	vi.clearAllMocks();
});
it('keeps cached ascents and the successful timestamp when a later API page fails', async () => {
	upsertAscents([ascent('existing'), ascent('not-seen-yet')]);
	getOrCreateSyncState('thecrag');
	const lastSuccessAt = '2026-01-01T00:00:00.000Z';
	updateSyncState('thecrag', { lastSuccessAt, cursor: '123' });
	vi.mocked(syncTheCragAll).mockImplementation(async (_key, _cursor, onPage) => {
		await onPage?.({
			ascents: [ascent('existing'), ascent('new')],
			done: false,
			nextCursor: { page: 2 }
		});
		throw new Error('Logbook access was denied');
	});
	await expect(runTheCragSync()).rejects.toThrow('Logbook access was denied');
	expect(
		db
			.select()
			.from(ascents)
			.all()
			.map((a) => a.externalId)
			.sort()
	).toEqual(['existing', 'new', 'not-seen-yet']);
	expect(getOrCreateSyncState('thecrag')).toMatchObject({
		status: 'error',
		lastSuccessAt,
		cursor: '123',
		lastError: 'Logbook access was denied'
	});
});
it('reports inserts across API pages, real prune totals and zero additions on a repeat full pull', async () => {
	upsertAscents([ascent('existing'), ascent('removed')]);
	vi.mocked(syncTheCragAll).mockImplementation(async (_key, _cursor, onPage) => {
		await onPage?.({
			ascents: [ascent('existing'), ascent('new-one', 'shared')],
			done: false,
			nextCursor: { page: 2 }
		});
		await onPage?.({ ascents: [ascent('new-two', 'shared')], done: true, nextCursor: null });
		return { count: 3, maxEpoch: null, profile: null };
	});
	expect(await runTheCragSync()).toMatchObject({
		skipped: false,
		count: 3,
		created: { routes: 1, ascents: 2 },
		pruned: { deletedAscents: 1, deletedRoutes: 1 }
	});
	expect(await runTheCragSync({ full: true })).toMatchObject({
		count: 3,
		created: { routes: 0, ascents: 0 },
		pruned: { deletedAscents: 0, deletedRoutes: 0 }
	});
});
it('returns only a skipped message for an overlapping run, then allows the active run to complete', async () => {
	let finish!: () => void;
	vi.mocked(syncTheCragAll).mockImplementation(
		() =>
			new Promise((resolve) => {
				finish = () => resolve({ count: 0, maxEpoch: null, profile: null });
			})
	);
	const active = runTheCragSync();
	try {
		expect(await runTheCragSync()).toEqual({ skipped: true, reason: 'Sync already in progress' });
	} finally {
		finish();
		await active;
	}
});
