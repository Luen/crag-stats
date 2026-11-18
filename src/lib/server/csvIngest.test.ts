import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { getFirstImport } from './firstImport';
import { CsvIngestError, csvUploadToken, ingestLogbookCsv, readCappedBody } from './csvIngest';
import { parseTheCragCsv } from './providers/thecrag/csv';
import { wipeAllData } from './wipe';

const sampleFile = readFileSync('samples/thecrag-logbook-sample.csv');
const sample = parseTheCragCsv(sampleFile);

beforeEach(() => wipeAllData());

describe('ingestLogbookCsv', () => {
	it('upserts the export and reports processed and new ascents', () => {
		const first = ingestLogbookCsv(sampleFile);
		expect(first.imported).toBe(sample.length);
		expect(first.created.ascents).toBe(sample.length);

		// Upsert-only: a repeat upload revisits every ascent but adds none, and never prunes.
		const second = ingestLogbookCsv(sampleFile);
		expect(second.imported).toBe(sample.length);
		expect(second.created.ascents).toBe(0);
	});

	it('dates First Moves from the first successful non-empty upload', () => {
		expect(getFirstImport()).toBeNull();
		ingestLogbookCsv(sampleFile);
		const first = getFirstImport();
		expect(first?.count).toBe(sample.length);
		expect(first?.at).not.toBeNull();

		ingestLogbookCsv(sampleFile);
		expect(getFirstImport()?.at).toBe(first?.at);
	});

	it('rejects a file with no ascents instead of reporting a successful no-op', () => {
		expect(() => ingestLogbookCsv(Buffer.from('Ascent ID,Route ID\n'))).toThrowError(
			expect.objectContaining({ reason: 'empty' })
		);
	});

	it('rejects a saved login page or other non-CSV body', () => {
		const html = Buffer.from('<!doctype html><html><body><form>Sign in</form></body></html>');
		try {
			ingestLogbookCsv(html);
			throw new Error('expected the import to fail');
		} catch (err) {
			expect(err).toBeInstanceOf(CsvIngestError);
			expect(['empty', 'invalid']).toContain((err as CsvIngestError).reason);
		}
	});
});

describe('readCappedBody', () => {
	function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
		const encoder = new TextEncoder();
		return new ReadableStream({
			start(controller) {
				for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
				controller.close();
			}
		});
	}

	it('joins every chunk', async () => {
		const body = await readCappedBody(streamOf('Ascent ID,', 'Route ID\n'), 1024);
		expect(body.toString('utf8')).toBe('Ascent ID,Route ID\n');
	});

	it('treats a missing body as empty', async () => {
		expect((await readCappedBody(null)).length).toBe(0);
	});

	it('rejects a body over the limit', async () => {
		await expect(readCappedBody(streamOf('12345', '67890'), 8)).rejects.toMatchObject({
			reason: 'too_large'
		});
	});
});

describe('csvUploadToken', () => {
	it('reads x-csv-token', () => {
		const headers = new Headers({ 'x-csv-token': '  secret  ' });
		expect(csvUploadToken(headers)).toBe('secret');
	});

	it('reads a case-insensitive Bearer credential', () => {
		const headers = new Headers({ authorization: 'bearer secret-token' });
		expect(csvUploadToken(headers)).toBe('secret-token');
	});

	it('returns null without a credential', () => {
		expect(csvUploadToken(new Headers())).toBeNull();
		expect(csvUploadToken(new Headers({ authorization: 'Basic abc' }))).toBeNull();
	});
});
