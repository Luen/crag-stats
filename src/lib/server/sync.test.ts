import { beforeEach, expect, it, vi } from 'vitest';
import { syncTheCragAll } from './providers/thecrag';
import { triggerRouteHistoryImport } from './routeHistoryImport';
import { runTheCragSync } from './sync';

vi.mock('./env', () => ({ env: () => 'synthetic-key' }));
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

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(syncTheCragAll).mockResolvedValue({ count: 0, maxEpoch: null, profile: null });
});

it('triggers background route enrichment after every successful sync', async () => {
	await runTheCragSync();
	await runTheCragSync({ full: true });
	expect(triggerRouteHistoryImport).toHaveBeenCalledTimes(2);
	expect(triggerRouteHistoryImport).toHaveBeenNthCalledWith(1, 'after sync');
	expect(triggerRouteHistoryImport).toHaveBeenNthCalledWith(2, 'after sync');
});

it('does not trigger route enrichment when the logbook sync fails', async () => {
	vi.mocked(syncTheCragAll).mockRejectedValueOnce(new Error('synthetic upstream failure'));
	await expect(runTheCragSync()).rejects.toThrow('synthetic upstream failure');
	expect(triggerRouteHistoryImport).not.toHaveBeenCalled();
});
