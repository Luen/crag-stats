import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { findNearestMigrationsDir, resolveMigrationsDir } from './migrationsPath';

const temps: string[] = [];

afterEach(() => {
	while (temps.length) {
		const dir = temps.pop();
		if (dir) rmSync(dir, { recursive: true, force: true });
	}
});

function scratch(): string {
	const dir = mkdtempSync(join(tmpdir(), 'crag-mig-'));
	temps.push(dir);
	return dir;
}

function writePkg(dir: string, name = 'crag-stats') {
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, private: true }));
}

function writeMigrations(dir: string, files: string[]) {
	const mig = join(dir, 'migrations');
	mkdirSync(mig, { recursive: true });
	for (const f of files) writeFileSync(join(mig, f), '-- test\n');
	return mig;
}

describe('resolveMigrationsDir (#161)', () => {
	it('prefers an explicit MIGRATIONS_DIR over parent or cwd trees', () => {
		const root = scratch();
		const override = writeMigrations(join(root, 'override'), ['0001_init.sql']);
		const parent = join(root, 'parent');
		writePkg(parent);
		writeMigrations(parent, ['0001_init.sql']);
		const child = join(parent, 'child');
		writePkg(child);
		writeMigrations(child, ['0001_init.sql', '0014_ascent_count_fetched_at.sql']);
		const fromDir = join(child, 'build', 'server', 'chunks');
		mkdirSync(fromDir, { recursive: true });

		expect(
			resolveMigrationsDir({
				envDir: override,
				cwd: child,
				fromDir
			})
		).toBe(override);
	});

	it('picks the nested checkout when a parent also has migrations (built chunk depth)', () => {
		const root = scratch();
		const parent = join(root, 'parent');
		writePkg(parent);
		const parentMig = writeMigrations(parent, ['0001_init.sql', '0013_route_ascent_snapshot.sql']);

		const child = join(parent, 'nested-review');
		writePkg(child);
		const childMig = writeMigrations(child, [
			'0001_init.sql',
			'0013_route_ascent_snapshot.sql',
			'0014_ascent_count_fetched_at.sql'
		]);

		// Compiled server: build/server/chunks/db.js — four ../ steps overshoot into parent.
		const fromDir = join(child, 'build', 'server', 'chunks');
		mkdirSync(fromDir, { recursive: true });

		expect(findNearestMigrationsDir(fromDir)).toBe(childMig);
		expect(
			resolveMigrationsDir({
				envDir: undefined,
				cwd: parent, // wrong cwd must not win over the module's package
				fromDir
			})
		).toBe(childMig);
		expect(resolveMigrationsDir({ fromDir, cwd: parent })).not.toBe(parentMig);
	});

	it('still finds migrations in source mode (src/lib/server/db)', () => {
		const root = scratch();
		writePkg(root);
		const mig = writeMigrations(root, ['0001_init.sql']);
		const fromDir = join(root, 'src', 'lib', 'server', 'db');
		mkdirSync(fromDir, { recursive: true });

		expect(resolveMigrationsDir({ fromDir, cwd: join(root, 'elsewhere') })).toBe(mig);
	});

	it('ignores an ancestor migrations dir that is not a crag-stats package', () => {
		const root = scratch();
		writePkg(root, 'other-app');
		writeMigrations(root, ['0001_init.sql']);
		const child = join(root, 'crag');
		writePkg(child);
		const childMig = writeMigrations(child, ['0001_init.sql']);
		const fromDir = join(child, 'build', 'server', 'chunks');
		mkdirSync(fromDir, { recursive: true });

		expect(resolveMigrationsDir({ fromDir, cwd: root })).toBe(childMig);
	});

	it('falls back to cwd/migrations when no package root is found', () => {
		const root = scratch();
		const cwd = join(root, 'orphan');
		mkdirSync(cwd, { recursive: true });
		const fromDir = join(root, 'somewhere', 'deep');
		mkdirSync(fromDir, { recursive: true });

		expect(resolveMigrationsDir({ fromDir, cwd })).toBe(join(cwd, 'migrations'));
	});
});
