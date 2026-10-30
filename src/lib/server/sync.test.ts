import { beforeEach, expect, it, vi } from 'vitest';
import { syncTheCragAll } from './providers/thecrag';
import { triggerRouteHistoryImport } from './routeHistoryImport';
import { triggerWeatherImport } from './weatherImport';
import { runTheCragSync } from './sync';
import { getTheCragSyncConfiguration } from './env';
import { syncTheCragCsv } from './csvLogbookSync';
import { reconcileProviderAscents, updateSyncState } from './ingest';
import { invalidateLogbookSync } from './syncGeneration';

vi.mock('./env', () => ({
	env: () => 'synthetic-key',
	getTheCragSyncConfiguration: vi.fn(() => ({ mode: 'api', configured: true }))
}));
vi.mock('./csvLogbookSync', () => ({ syncTheCragCsv: vi.fn() }));
vi.mock('./providers/thecrag', () => ({ syncTheCragAll: vi.fn() }));
vi.mock('./ingest', () => ({
	getOrCreateSyncState: vi.fn(),
	reconcileProviderAscents: vi.fn(() => 0),
	updateSyncState: vi.fn(),
	upsertAscents: vi.fn(),
	upsertProfile: vi.fn()
}));
vi.mock('./projects', () => ({ refreshProjects: vi.fn() }));
vi.mock('./repairGrades', () => ({ repairGradesFromRawJson: vi.fn() }));
vi.mock('./routeHistoryImport', () => ({ triggerRouteHistoryImport: vi.fn() }));
vi.mock('./weatherImport', () => ({ triggerWeatherImport: vi.fn() }));

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ mode: 'api', configured: true });
	vi.mocked(syncTheCragAll).mockResolvedValue({ count: 0, maxEpoch: null, profile: null });
});

it('uses CSV when selected, returns CSV prune stats, and triggers normal post-sync work', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ mode: 'csv', configured: true });
	vi.mocked(syncTheCragCsv).mockResolvedValue({
		count: 2,
		profileName: 'Synthetic climber',
		pruned: { deletedAscents: 1, deletedRoutes: 0, deletedProjects: 0 }
	});
	expect(await runTheCragSync()).toMatchObject({
		count: 2,
		pruned: { deletedAscents: 1, deletedRoutes: 0, deletedProjects: 0 },
		maxEpoch: null
	});
	expect(syncTheCragAll).not.toHaveBeenCalled();
	// Prune runs inside syncTheCragCsv, not via a second reconcile from runTheCragSync.
	expect(reconcileProviderAscents).not.toHaveBeenCalled();
	expect(triggerRouteHistoryImport).toHaveBeenCalledOnce();
	expect(triggerWeatherImport).toHaveBeenCalledOnce();
});

it('does not fall back to CSV after an API error', async () => {
	vi.mocked(syncTheCragAll).mockRejectedValueOnce(new Error('synthetic failure'));
	await expect(runTheCragSync()).rejects.toThrow('synthetic failure');
	expect(syncTheCragCsv).not.toHaveBeenCalled();
});

it('does not record a successful sync or recreate state after a wipe', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ mode: 'csv', configured: true });
	vi.mocked(syncTheCragCsv).mockImplementationOnce(async () => {
		invalidateLogbookSync();
		return {
			count: 2,
			profileName: 'Synthetic climber',
			pruned: { deletedAscents: 0, deletedRoutes: 0, deletedProjects: 0 }
		};
	});
	await expect(runTheCragSync()).rejects.toThrow('cancelled');
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
