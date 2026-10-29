import { beforeEach, expect, it, vi } from 'vitest';
import cron from 'node-cron';
import { getTheCragSyncConfiguration } from './env';
import { getSyncStatus, runTheCragSync } from './sync';

vi.mock('node-cron', () => ({ default: { validate: vi.fn(() => true), schedule: vi.fn() } }));
vi.mock('./env', () => ({ env: () => '0 6 * * *', getTheCragSyncConfiguration: vi.fn() }));
vi.mock('./sync', () => ({ getSyncStatus: vi.fn(), runTheCragSync: vi.fn() }));

beforeEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
	vi.mocked(runTheCragSync).mockResolvedValue({
		skipped: false,
		count: 0,
		pruned: { deletedAscents: 0, deletedRoutes: 0, deletedProjects: 0 },
		maxEpoch: null,
		profileName: 'Synthetic climber'
	});
});

it('starts scheduled and initial CSV sync without an API key', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ mode: 'csv', configured: true });
	vi.mocked(getSyncStatus).mockReturnValue({ lastSuccessAt: null } as ReturnType<
		typeof getSyncStatus
	>);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).toHaveBeenCalledOnce();
	expect(runTheCragSync).toHaveBeenCalledOnce();
});

it('does not attempt automatic login with missing credentials', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ mode: 'csv', configured: false });
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).not.toHaveBeenCalled();
	expect(runTheCragSync).not.toHaveBeenCalled();
});
