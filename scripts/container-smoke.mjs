/** Run inside a disposable container; never point this at a deployment database. */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';

assert.equal(process.env.CRAG_STATS_CONTAINER_SMOKE, '1', 'Use a disposable smoke-test container');
process.env.DATABASE_PATH = `/tmp/crag-stats-smoke-${randomUUID()}.sqlite`;
process.env.THECRAG_API_KEY = '';
process.env.SYNC_CRON = '';
process.env.APP_PASSWORD = '';
process.env.AUTH_SCOPE = 'settings';

const { runMigrations } = await import('./migrate.mjs');
assert.ok(runMigrations().applied.length > 0);
const Database = (await import('better-sqlite3')).default;
const db = new Database(process.env.DATABASE_PATH);
assert.equal(db.prepare('SELECT 1 AS n').get().n, 1);
db.close();

const child = spawn(process.execPath, ['scripts/server.mjs'], {
	stdio: ['ignore', 'pipe', 'pipe']
});
let output = '';
for (const stream of [child.stdout, child.stderr]) {
	stream.on('data', (chunk) => (output = (output + chunk).slice(-8000)));
}
const origin = `http://127.0.0.1:${process.env.PORT || 3000}`;
try {
	let ready = false;
	for (let i = 0; i < 120; i++) {
		assert.equal(child.exitCode, null, output);
		assert.equal(child.signalCode, null, output);
		try {
			if ((await fetch(origin, { signal: AbortSignal.timeout(2000) })).ok) {
				ready = true;
				break;
			}
		} catch {
			// The production server has not bound its port yet.
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}
	assert.ok(ready, output);
	const form = new FormData();
	form.set('file', new Blob([readFileSync('/fixtures/logbook.csv')]), 'sample.csv');
	const response = await fetch(`${origin}/settings?/importCsv`, {
		method: 'POST',
		headers: { origin, accept: 'application/json' },
		body: form
	});
	assert.equal(response.status, 200);
	assert.match(await response.text(), /imported/);
	assert.match(await (await fetch(`${origin}/logbook?q=Hard%20Project`)).text(), /Hard Project/);
} finally {
	if (child.exitCode === null && child.signalCode === null) {
		const exited = once(child, 'exit');
		child.kill('SIGTERM');
		const force = setTimeout(() => child.kill('SIGKILL'), 5000);
		await exited;
		clearTimeout(force);
	}
}

if (process.argv.includes('--importer')) {
	// Real native loading and decompression, with synthetic loopback data, never theCrag.
	const fixture = createServer((request, response) => {
		response.writeHead(200, { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' });
		response.end(gzipSync(JSON.stringify({ ok: true })));
	});
	await new Promise((resolve) => fixture.listen(0, '127.0.0.1', resolve));
	try {
		const { Session } = await import('impers');
		const session = new Session({ impersonate: 'chrome', timeout: 20 });
		try {
			const local = await session.get(`http://127.0.0.1:${fixture.address().port}`);
			assert.equal(local.status, 200);
			assert.equal(JSON.parse(local.text).ok, true);
			// Verify default HTTPS certificate handling against a public download host.
			assert.equal((await session.get('https://github.com/')).status, 200);
		} finally {
			await session.close();
		}
	} finally {
		await new Promise((resolve) => fixture.close(resolve));
	}
}
console.log(
	`Container smoke checks passed (${process.arch}${process.argv.includes('--importer') ? ', importer + HTTPS' : ''}).`
);
