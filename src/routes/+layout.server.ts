import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isAuthEnabled, authScope } from '#lib/server/auth';
import { startScheduler } from '#lib/server/scheduler';
import type { LayoutServerLoad } from './$types';

// Start daily sync when the Node server boots (no-op in environments without API key).
startScheduler();

function readAppVersion(): string {
	try {
		const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
		const pkg = JSON.parse(raw) as { version?: string };
		return pkg.version ? `v${pkg.version}` : 'dev';
	} catch {
		return 'dev';
	}
}

export const load: LayoutServerLoad = async ({ locals }) => {
	const authOn = isAuthEnabled();
	const scope = authScope();
	const showSettings = !authOn || locals.authed;
	return {
		appVersion: readAppVersion(),
		githubUrl: 'https://github.com/Luen/crag-stats',
		authed: locals.authed,
		authEnabled: authOn,
		authScope: scope,
		showSettings
	};
};
