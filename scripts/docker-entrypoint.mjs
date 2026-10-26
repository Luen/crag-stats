#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { runMigrations } from './migrate.mjs';

try {
	const result = runMigrations();
	if (result.applied.length) {
		console.log(`[entrypoint] applied migrations: ${result.applied.join(', ')}`);
	} else {
		console.log('[entrypoint] database schema up to date');
	}
} catch (err) {
	console.error('[entrypoint] migration failed:', err instanceof Error ? err.message : err);
	process.exit(1);
}

const args = process.argv.slice(2);
if (args.length === 0) {
	console.error('[entrypoint] no command provided');
	process.exit(1);
}

const child = spawn(args[0], args.slice(1), { stdio: 'inherit', env: process.env });
child.on('exit', (code, signal) => {
	if (signal) process.kill(process.pid, signal);
	process.exit(code ?? 1);
});
