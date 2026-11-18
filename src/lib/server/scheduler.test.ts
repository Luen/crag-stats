import { beforeEach, expect, it, vi } from 'vitest';
import cron from 'node-cron';
import { getTheCragSyncConfiguration } from './env';
import { isRouteHistoryImportEnabled, triggerRouteHistoryImport } from './routeHistoryImport';
import { getSyncStatus, runTheCragSync } from './sync';
import { isWeatherImportEnabled, triggerWeatherImport } from './weatherImport';

vi.mock('node-cron', () => ({ default: { validate: vi.fn(() => true), schedule: vi.fn() } }));
const cronExpr = vi.hoisted(() => ({ value: '0 6 * * *', import: '0 6 * * *' }));
vi.mock('./env', () => ({
	env: (name: string, fallback?: string) =>
		(name === 'IMPORT_CRON' ? cronExpr.import : cronExpr.value) || fallback || '',
	getTheCragSyncConfiguration: vi.fn()
}));
vi.mock('./sync', () => ({ getSyncStatus: vi.fn(), runTheCragSync: vi.fn() }));
vi.mock('./routeHistoryImport', () => ({
	triggerRouteHistoryImport: vi.fn(),
	isRouteHistoryImportEnabled: vi.fn(() => false)
}));
vi.mock('./weatherImport', () => ({
	triggerWeatherImport: vi.fn(),
	isWeatherImportEnabled: vi.fn(() => false)
}));

beforeEach(() => {
	cronExpr.value = '0 6 * * *';
	cronExpr.import = '0 6 * * *';
	vi.resetModules();
	vi.clearAllMocks();
	vi.mocked(isRouteHistoryImportEnabled).mockReturnValue(false);
	vi.mocked(isWeatherImportEnabled).mockReturnValue(false);
	vi.mocked(runTheCragSync).mockResolvedValue({
		skipped: false,
		count: 0,
		created: { routes: 0, ascents: 0 },
		pruned: { deletedAscents: 0, deletedRoutes: 0, deletedProjects: 0 },
		maxEpoch: null,
		profileName: 'Synthetic climber'
	});
});

it('starts scheduled and initial sync when an API key is configured', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: true, mode: 'api' });
	vi.mocked(getSyncStatus).mockReturnValue({ lastSuccessAt: null } as ReturnType<
		typeof getSyncStatus
	>);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).toHaveBeenCalledOnce();
	expect(runTheCragSync).toHaveBeenCalledOnce();
	expect(triggerRouteHistoryImport).not.toHaveBeenCalled();
});

it('resumes pending background imports at boot after an upgrade', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: true, mode: 'api' });
	vi.mocked(getSyncStatus).mockReturnValue({
		lastSuccessAt: '2026-11-01T20:00:00.000Z'
	} as ReturnType<typeof getSyncStatus>);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(runTheCragSync).not.toHaveBeenCalled();
	expect(triggerRouteHistoryImport).toHaveBeenCalledWith('startup');
	expect(triggerWeatherImport).toHaveBeenCalledWith('startup');
});

it('does not schedule sync without an API key', async () => {
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: false, mode: 'csv' });
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).not.toHaveBeenCalled();
	expect(runTheCragSync).not.toHaveBeenCalled();
	expect(triggerRouteHistoryImport).not.toHaveBeenCalled();
});

it('SYNC_CRON=off skips scheduled and boot-time sync even with a key', async () => {
	cronExpr.value = 'OFF';
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: true, mode: 'api' });
	vi.mocked(getSyncStatus).mockReturnValue({ lastSuccessAt: null } as ReturnType<
		typeof getSyncStatus
	>);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).not.toHaveBeenCalled();
	expect(runTheCragSync).not.toHaveBeenCalled();
});

it('runs route and weather imports on IMPORT_CRON when only a CSV logbook exists', async () => {
	// No logbook key: the API sync (and its prune) must never start, but route data
	// still needs to drain for a CSV-only install.
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: false, mode: 'csv' });
	vi.mocked(isRouteHistoryImportEnabled).mockReturnValue(true);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(runTheCragSync).not.toHaveBeenCalled();
	expect(triggerRouteHistoryImport).toHaveBeenCalledWith('startup');
	expect(cron.schedule).toHaveBeenCalledOnce();
});

it('IMPORT_CRON=off disables the background import schedule but keeps the boot resume', async () => {
	cronExpr.import = 'off';
	vi.mocked(getTheCragSyncConfiguration).mockReturnValue({ configured: false, mode: 'csv' });
	vi.mocked(isWeatherImportEnabled).mockReturnValue(true);
	const { startScheduler } = await import('./scheduler');
	startScheduler();
	expect(cron.schedule).not.toHaveBeenCalled();
	expect(triggerWeatherImport).toHaveBeenCalledWith('startup');
});
