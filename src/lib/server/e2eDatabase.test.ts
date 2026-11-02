import {
	mkdtempSync,
	mkdirSync,
	existsSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, expect, it } from 'vitest';
import { resetE2eDatabase } from '../../../scripts/e2eDatabase.mjs';

const roots: string[] = [];
function workspace() {
	const root = mkdtempSync(join(tmpdir(), 'crag-e2e-reset-'));
	roots.push(root);
	return root;
}
afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

it('starts fresh after a previous fixture run and permits the same unique IDs again', () => {
	const root = workspace();
	for (const name of ['open', 'settings', 'all']) {
		const path = resetE2eDatabase(name, root);
		let db = new Database(path);
		db.exec(
			"CREATE TABLE routes (external_id TEXT UNIQUE); INSERT INTO routes VALUES ('review-weather-0')"
		);
		db.close();
		// Represent files that can survive an interrupted WAL-mode process.
		writeFileSync(path + '-wal', 'stale WAL');
		writeFileSync(path + '-shm', 'stale shared memory');
		expect(resetE2eDatabase(name, root)).toBe(path);
		expect(existsSync(path)).toBe(false);
		expect(existsSync(path + '-wal')).toBe(false);
		expect(existsSync(path + '-shm')).toBe(false);
		db = new Database(path);
		db.exec(
			"CREATE TABLE routes (external_id TEXT UNIQUE); INSERT INTO routes VALUES ('review-weather-0')"
		);
		db.close();
	}
});

it('preserves other databases, traces, screenshots and application data', () => {
	const root = workspace();
	const path = resetE2eDatabase('open', root);
	mkdirSync(join(root, 'data'));
	mkdirSync(join(root, 'test-results'));
	const preserved = [
		join(root, 'data', 'crag-stats.sqlite'),
		join(root, 'test-results', 'trace.zip'),
		join(root, 'e2e', '.tmp', 'settings.sqlite'),
		join(root, 'e2e', '.tmp', 'screenshot.png')
	];
	for (const file of preserved) writeFileSync(file, 'keep');
	writeFileSync(path, 'stale');
	resetE2eDatabase('open', root);
	for (const file of preserved) expect(readFileSync(file, 'utf8')).toBe('keep');
	expect(() => resetE2eDatabase('../../data/crag-stats', root)).toThrow('Unknown e2e server');
});

it('refuses a linked temporary directory before deleting outside the workspace', () => {
	const root = workspace();
	const outside = workspace();
	mkdirSync(join(root, 'e2e'));
	const target = join(outside, 'open.sqlite');
	writeFileSync(target, 'keep');
	symlinkSync(
		outside,
		join(root, 'e2e', '.tmp'),
		process.platform === 'win32' ? 'junction' : 'dir'
	);
	expect(() => resetE2eDatabase('open', root)).toThrow('linked directory');
	expect(readFileSync(target, 'utf8')).toBe('keep');
});
