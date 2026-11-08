import { beforeEach, expect, it, vi } from 'vitest';
import { syncTheCragAll } from './providers/thecrag';
import { triggerRouteHistoryImport } from './routeHistoryImport';
import { triggerWeatherImport } from './weatherImport';
import { runTheCragSync } from './sync';
import { getTheCragSyncConfiguration } from './env';
import { reconcileProviderAscents, updateSyncState } from './ingest';
import { invalidateLogbookSync } from './syncGeneration';

vi.mock('./env', () => ({
	env: () => 'synthetic-key',
	getTheCragSyncConfiguration: vi.fn(() => ({ configured: true, csvModeRemoved: false }))
}));
vi.mock('./providers/thecrag', () => ({ syncTheCragAll: vi.fn() }));
vi.mock('./ingest', () => ({
	getOrCreateSyncState: vi.fn(),
	reconcileProviderAscents: vi.fn(() => ({
		deletedAscents: 0,
		deletedRoutes: 0,
		deletedProjects: 0
	})),
	updateSyncState: vi.fn(),
	upsertAscents: vi.fn(() => ({ routes: 0, ascents: 0 })),
	upsertProfile: vi.fn()
}));
vi.mock('./projects', () => ({ refreshProjects: vi.fn() }));
vi.mock('./repairGrades', () => ({ repairGradesFromRawJson: vi.fn() }));
vi.mock('./routeHistoryImport', () => ({ triggerRouteHistoryImport: vi.fn() }));
vi.mock('./weatherImport', () => ({ triggerWeatherImport: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({
		configured: true,
		csvModeRemoved: false
	});
	vi.mocked(syncTheCragAll).mockResolvedValue({ count: 0, maxEpoch: null, profile: null });
});

it('refuses a leftover THECRAG_SYNC_MODE=csv without contacting theCrag', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({
		configured: false,
		csvModeRemoved: true
	});
	await expect(runTheCragSync()).rejects.toThrow('Automatic CSV sync has been removed');
	expect(syncTheCragAll).not.toHaveBeenCalled();
	expect(updateSyncState).not.toHaveBeenCalled();
});

it('does not record a successful sync or recreate state after a wipe', async () => {
	vi.mocked(syncTheCragAll).mockImplementationOnce(async () => {
		invalidateLogbookSync();
		return { count: 2, maxEpoch: null, profile: null };
	});
	await expect(runTheCragSync()).rejects.toThrow('cancelled');
	expect(reconcileProviderAscents).not.toHaveBeenCalled();
	expect(updateSyncState).toHaveBeenCalledTimes(2); // running, then idle after cancel
	expect(updateSyncState).toHaveBeenLastCalledWith('thecrag', { status: 'idle', lastError: null });
	expect(triggerRouteHistoryImport).not.toHaveBeenCalled();
	expect(triggerWeatherImport).not.toHaveBeenCalled();
});

it('triggers background route enrichment after every successful sync', async () => {
	await runTheCragSync();
	await runTheCragSync({ full: true });
	expect(triggerRouteHistoryImport).toHaveBeenCalledTimes(2);
	expect(triggerRouteHistoryImport).toHaveBeenNthCalledWith(1, 'after sync');
	expect(triggerRouteHistoryImport).toHaveBeenNthCalledWith(2, 'after sync');
	expect(triggerWeatherImport).toHaveBeenCalledTimes(2);
	expect(triggerWeatherImport).toHaveBeenNthCalledWith(1, 'after sync');
	expect(triggerWeatherImport).toHaveBeenNthCalledWith(2, 'after sync');
});

it('does not trigger route enrichment when the logbook sync fails', async () => {
	vi.mocked(syncTheCragAll).mockRejectedValueOnce(new Error('synthetic upstream failure'));
	await expect(runTheCragSync()).rejects.toThrow('synthetic upstream failure');
	expect(triggerRouteHistoryImport).not.toHaveBeenCalled();
	expect(triggerWeatherImport).not.toHaveBeenCalled();
});
