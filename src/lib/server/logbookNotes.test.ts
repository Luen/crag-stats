import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { listLogbook } from './analytics';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

// In-memory DB (vitest.config.ts). The sample CSV's only note is "Almost".
beforeAll(() => {
	upsertAscents(parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv')));
});

describe('listLogbook private notes', () => {
	it('strips notes by default', () => {
		const { rows } = listLogbook();
		expect(rows.length).toBeGreaterThan(0);
		expect(rows.every((r) => r.comment == null)).toBe(true);
	});

	it("doesn't let search match hidden notes", () => {
		expect(listLogbook({ q: 'almost' }).total).toBe(0);
	});

	it('returns and searches notes when includeNotes is set', () => {
		expect(listLogbook({ includeNotes: true }).rows.some((r) => r.comment === 'Almost')).toBe(true);
		expect(listLogbook({ q: 'almost', includeNotes: true }).total).toBe(1);
	});
});
