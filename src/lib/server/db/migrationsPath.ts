/**
 * Resolve which /migrations directory the server should apply.
 * Built chunks live under build/server/chunks/, so a fixed ../../../../ walk
 * from import.meta.url can land in a parent checkout (#161). Prefer the nearest
 * package root that owns this app (package.json name crag-stats).
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const PACKAGE_NAME = 'crag-stats';

export type MigrationsPathOptions = {
	/** Explicit override (env MIGRATIONS_DIR). */
	envDir?: string | null;
	cwd?: string;
	/** Directory to walk upward from (usually dirname(import.meta.url)). */
	fromDir: string;
};

function isCragStatsPackage(pkgPath: string): boolean {
	if (!existsSync(pkgPath)) return false;
	try {
		const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as { name?: unknown };
		return pkg?.name === PACKAGE_NAME;
	} catch {
		return false;
	}
}

/** Walk fromDir upward; return the nearest …/migrations under a crag-stats package.json. */
export function findNearestMigrationsDir(fromDir: string): string | null {
	let dir = fromDir;
	for (;;) {
		const migrations = join(dir, 'migrations');
		if (existsSync(migrations) && isCragStatsPackage(join(dir, 'package.json'))) {
			return migrations;
		}
		const parent = dirname(dir);
		if (parent === dir) break;
		dir = parent;
	}
	return null;
}

/**
 * 1. MIGRATIONS_DIR when set (explicit wins even if the path is missing).
 * 2. Nearest package-owned migrations from the module directory.
 * 3. process.cwd()/migrations as a last resort.
 */
export function resolveMigrationsDir(opts: MigrationsPathOptions): string {
	const envDir = opts.envDir?.trim();
	if (envDir) return envDir;

	const nearest = findNearestMigrationsDir(opts.fromDir);
	if (nearest) return nearest;

	return join(opts.cwd ?? process.cwd(), 'migrations');
}
