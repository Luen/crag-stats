import { eq, sql } from 'drizzle-orm';
import { db, ensureSchema } from './db';
import { appSettings, ascents } from './db/schema';
import type { DateDisplay } from '#lib/dates';

const KEY = 'first_import';
let generation = 0;

export type FirstImport = {
	at: string | null;
	count: number;
	/** Existing logbooks have no recoverable first-import timestamp. */
	legacy: boolean;
};

export function getFirstImport(): FirstImport | null {
	ensureSchema();
	const raw = db.select().from(appSettings).where(eq(appSettings.key, KEY)).get()?.value;
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
	const record = { key: KEY, value: JSON.stringify(value), updatedAt: new Date().toISOString() };
	db.insert(appSettings)
		.values(record)
		.onConflictDoUpdate({ target: appSettings.key, set: record })
		.run();
}

/** Capture before importing: distinguish a fresh install from an older logbook. */
export function beginFirstImport(): number {
	ensureSchema();
	if (!getFirstImport()) {
		const count = countAscents();
		save({ at: null, count, legacy: count > 0 });
	}
	return generation;
}

/** Only a successful non-empty import completes a fresh milestone; later syncs leave it alone. */
export function completeFirstImport(count: number, token: number, at = new Date().toISOString()) {
	if (token !== generation || count <= 0) return;
	const first = getFirstImport();
	if (first && !first.legacy && !first.at) save({ at, count, legacy: false });
}

/** Legacy owners can supply the original date; this never uses a climb or latest-sync date. */
export function correctFirstImportDate(date: string) {
	if (
		!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
		!Number.isFinite(Date.parse(`${date}T12:00:00Z`)) ||
		new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) !== date
	) {
		throw new Error('Enter a valid first import date.');
	}
	// Allow one day of slack so a timezone ahead of UTC can enter "today".
	if (Date.parse(`${date}T00:00:00Z`) > Date.now() + 24 * 3600_000) {
		throw new Error('The first import date cannot be in the future.');
	}
	ensureSchema();
	const first = getFirstImport();
	const count = first?.count || countAscents();
	if (!count) throw new Error('Import a logbook before setting its first import date.');
	save({ at: date, count, legacy: false });
}

export function firstImportDateInput(first: FirstImport | null, display: DateDisplay): string {
	if (!first?.at) return '';
	if (/^\d{4}-\d{2}-\d{2}$/.test(first.at)) return first.at;
	let parts: Intl.DateTimeFormatPart[];
	try {
		parts = new Intl.DateTimeFormat('en', {
			timeZone: display.timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit'
		}).formatToParts(new Date(first.at));
	} catch {
		return first.at.slice(0, 10);
	}
	return ['year', 'month', 'day']
		.map((type) => parts.find((p) => p.type === type)!.value)
		.join('-');
}

export function resetFirstImport() {
	generation += 1;
	ensureSchema();
	db.delete(appSettings).where(eq(appSettings.key, KEY)).run();
}
