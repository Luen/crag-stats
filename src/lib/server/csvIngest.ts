/**
 * Shared theCrag CSV ingest, used by Settings → CSV import and the
 * `POST /api/logbook/csv` endpoint that a companion uploader calls.
 *
 * CSV uploads are upsert-only: they add and update ascents but never prune
 * anything missing from the file (see AGENTS.md, "Sync model").
 */
import { db } from './db';
import { beginFirstImport, completeFirstImport } from './firstImport';
import { upsertAscents } from './ingest';
import { refreshProjects } from './projects';
import { parseTheCragCsv } from './providers/thecrag';
import { triggerRouteHistoryImport } from './routeHistoryImport';
import { triggerWeatherImport } from './weatherImport';

/** A theCrag logbook export is a few MB; anything far larger is not one. */
export const MAX_CSV_BYTES = 25 * 1024 * 1024;

export type CsvIngestSummary = {
	imported: number;
	created: { routes: number; ascents: number };
};

export type CsvIngestFailure = 'too_large' | 'empty' | 'invalid';

/** Upload problems that are safe to describe to the caller. */
export class CsvIngestError extends Error {
	constructor(
		readonly reason: CsvIngestFailure,
		message: string
	) {
		super(message);
		this.name = 'CsvIngestError';
	}
}

/**
 * Read a request body without buffering more than `limit` bytes, so an oversized
 * upload is rejected instead of filling memory.
 */
export async function readCappedBody(
	body: ReadableStream<Uint8Array> | null,
	limit = MAX_CSV_BYTES
): Promise<Buffer> {
	if (!body) return Buffer.alloc(0);
	const reader = body.getReader();
	const chunks: Buffer[] = [];
	let total = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			if (!value?.byteLength) continue;
			total += value.byteLength;
			if (total > limit) {
				throw new CsvIngestError('too_large', `CSV upload exceeds ${limit} bytes.`);
			}
			chunks.push(Buffer.from(value));
		}
	} finally {
		// Release the connection, whether we finished, rejected, or threw mid-stream.
		await reader.cancel().catch(() => {});
	}
	return Buffer.concat(chunks, total);
}

/** `x-csv-token`, or a `Bearer` credential in `Authorization`. */
export function csvUploadToken(headers: Headers): string | null {
	const direct = headers.get('x-csv-token')?.trim();
	if (direct) return direct;
	const match = /^Bearer\s+(\S.*)$/i.exec(headers.get('authorization')?.trim() ?? '');
	return match ? match[1].trim() : null;
}

/** Parse and upsert a theCrag CSV export inside one transaction. */
export function ingestLogbookCsv(file: Buffer): CsvIngestSummary {
	let ascents;
	try {
		ascents = parseTheCragCsv(file);
	} catch (err) {
		throw new CsvIngestError(
			'invalid',
			`Could not read the CSV export: ${err instanceof Error ? err.message : String(err)}`
		);
	}
	// An empty result usually means a login page or HTML error page was saved
	// instead of the export; report it rather than reporting a successful no-op.
	if (ascents.length === 0) {
		throw new CsvIngestError('empty', 'No ascents found in the CSV export.');
	}

	const created = db.transaction(() => {
		const token = beginFirstImport();
		const counts = upsertAscents(ascents);
		refreshProjects();
		completeFirstImport(ascents.length, token);
		return counts;
	});

	// Like an API sync: start the opt-in route data (ROUTE_DATA_IMPORT) and weather
	// (WEATHER_IMPORT) imports in the background, so new climbs are enriched without
	// waiting for IMPORT_CRON. Both keep their own pacing, run gap, and back-off.
	triggerRouteHistoryImport('after CSV import');
	triggerWeatherImport('after CSV import');

	return { imported: ascents.length, created };
}
