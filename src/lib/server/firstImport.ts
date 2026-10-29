import { eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { appSettings, ascents } from './db/schema';

const FIRST_IMPORT_SETTING = 'first_import';
let generation = 0;

export type FirstImport = {
	at: string | null;
	count: number;
	/**
	 * Retained for older `app_settings` JSON. New writes always use `false`;
	 * completion no longer treats legacy installs specially.
	 */
	legacy: boolean;
};

export function getFirstImport(): FirstImport | null {
	ensureSchema();
	const raw = db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, FIRST_IMPORT_SETTING))
		.get()?.value;
	if (!raw) return null;
	try {
		const value = JSON.parse(raw) as FirstImport;
		if (!Number.isInteger(value.count) || value.count < 0 || typeof value.legacy !== 'boolean')
			return null;
		if (
			value.at !== null &&
			(typeof value.at !== 'string' || !Number.isFinite(Date.parse(value.at)))
		)
			return null;
		return value;
	} catch {
		return null;
	}
}

function countAscents(): number {
	return db
		.select({ n: sql<number>`count(*)` })
		.from(ascents)
		.get()!.n;
}

function save(value: FirstImport) {
	const record = {
		key: FIRST_IMPORT_SETTING,
		value: JSON.stringify(value),
		updatedAt: new Date().toISOString()
	};
	db.insert(appSettings)
		.values(record)
		.onConflictDoUpdate({ target: appSettings.key, set: record })
		.run();
}

/** Capture before importing so a concurrent wipe can invalidate this completion. */
export function beginFirstImport(): number {
	ensureSchema();
	if (!getFirstImport()) {
		save({ at: null, count: countAscents(), legacy: false });
	}
	return generation;
}

/** Only a successful non-empty import completes the milestone; later syncs leave it alone. */
export function completeFirstImport(count: number, token: number, at = new Date().toISOString()) {
	if (token !== generation || count <= 0) return;
	const first = getFirstImport();
	if (first && !first.at) save({ at, count, legacy: false });
}

export function resetFirstImport() {
	generation += 1;
	ensureSchema();
	db.delete(appSettings).where(eq(appSettings.key, FIRST_IMPORT_SETTING)).run();
}
