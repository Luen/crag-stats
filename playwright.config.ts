import { defineConfig, devices } from '@playwright/test';
import { randomBytes } from 'node:crypto';

/**
 * E2E against the production build (`pnpm build` first). Three servers cover the auth modes:
 * open (no password), AUTH_SCOPE=settings and AUTH_SCOPE=all. Each gets its own throwaway
 * SQLite file under e2e/.tmp; the open server is seeded from samples/ by the `setup` project.
 */
export const PORTS = { open: 4301, settings: 4302, all: 4303 } as const;
// Share one generated value with web servers and test workers, which reload this config.
export const TEST_PASSWORD = (process.env.CRAG_STATS_E2E_PASSWORD ||=
	randomBytes(24).toString('hex'));
const sessionSecret = (process.env.CRAG_STATS_E2E_SESSION_SECRET ||=
	randomBytes(32).toString('hex'));

const server = (name: keyof typeof PORTS, env: Record<string, string>) => ({
	// Same entry as Docker; plain HTTP like a LAN install (#47).
	command: 'node scripts/server.mjs',
	port: PORTS[name],
	reuseExistingServer: false,
	timeout: 60_000,
	env: {
		PORT: String(PORTS[name]),
		HOST: '127.0.0.1',
		DATABASE_PATH: `e2e/.tmp/${name}.sqlite`,
		SESSION_SECRET: sessionSecret,
		THECRAG_API_KEY: '',
		THECRAG_SYNC_MODE: 'api',
		THECRAG_USERNAME: '',
		THECRAG_PASSWORD: '',
		SYNC_CRON: '',
		TZ: 'Australia/Brisbane',
		APP_PASSWORD: '',
		...env
	}
});

export default defineConfig({
	testDir: 'e2e',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['list']] : 'list',
	use: {
		baseURL: `http://localhost:${PORTS.open}`,
		trace: 'retain-on-failure'
	},
	webServer: [
		server('open', {}),
		server('settings', {
			APP_PASSWORD: TEST_PASSWORD,
			AUTH_SCOPE: 'settings',
			THECRAG_SYNC_MODE: 'csv',
			THECRAG_USERNAME: 'synthetic-account'
		}),
		// Also covers the explicit ORIGIN override path.
		server('all', {
			APP_PASSWORD: TEST_PASSWORD,
			AUTH_SCOPE: 'all',
			ORIGIN: `http://localhost:${PORTS.all}`
		})
	],
	projects: [
		{ name: 'setup', testMatch: /seed\.setup\.ts/ },
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
			dependencies: ['setup']
		}
	]
});
