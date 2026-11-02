import { lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reset only a named Playwright database, before its server opens SQLite.
 * @param {string} name
 * @param {string} root
 */
export function resetE2eDatabase(name, root = process.cwd()) {
	if (!['open', 'settings', 'all'].includes(name)) throw new Error('Unknown e2e server name');
	let directory = realpathSync(root);
	for (const part of ['e2e', '.tmp']) {
		directory = join(directory, part);
		mkdirSync(directory, { recursive: true });
		if (lstatSync(directory).isSymbolicLink() || realpathSync(directory) !== directory) {
			throw new Error('Refusing to reset e2e databases through a linked directory');
		}
	}
	const databasePath = join(directory, `${name}.sqlite`);
	for (const suffix of ['', '-wal', '-shm']) rmSync(databasePath + suffix, { force: true });
	return databasePath;
}
