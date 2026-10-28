import { beforeEach, describe, expect, it } from 'vitest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import { notesVisible } from './notes';
import { mapAscent } from './providers/thecrag/api';

const PUBLIC = 'synthetic-public-note-168';
const PRIVATE = 'synthetic-private-note-168';

function importNotes(markdown?: string | null, privateMarkdown?: string | null) {
	const ascent = mapAscent({
		id: 'review-api-notes',
		date: '2026-01-01',
		tick: { name: 'Tick' },
		markdown,
		privateMarkdown,
		route: { id: 'review-api-notes', name: 'API note route', grade: '18', style: 'Sport' }
	});
	if (!ascent) throw new Error('Invalid synthetic ascent');
	upsertAscents([ascent]);
}

beforeEach(() => wipeAllData());

describe('API ascent notes privacy', () => {
	it('keeps both comment sources out of public results, searches and dashboard data', () => {
		importNotes(PUBLIC, PRIVATE);
		for (const includeNotes of [undefined, notesVisible(true, false), notesVisible(false, true)]) {
			expect(listLogbook({ includeNotes }).rows[0]?.comment).toBeNull();
			for (const q of [PUBLIC, PRIVATE]) expect(listLogbook({ q, includeNotes }).total).toBe(0);
		}
		const dashboard = JSON.stringify(getDashboardStats());
		expect(dashboard).not.toContain(PUBLIC);
		expect(dashboard).not.toContain(PRIVATE);
	});

	it('returns both imported notes only for an opted-in owner', () => {
		importNotes(PUBLIC, PRIVATE);
		const includeNotes = notesVisible(true, true);
		expect(listLogbook({ includeNotes }).rows[0]?.comment).toBe(`${PUBLIC}\n\n${PRIVATE}`);
		for (const q of [PUBLIC, PRIVATE]) expect(listLogbook({ q, includeNotes }).total).toBe(1);
	});

	it('removes stale private text when a later provider update omits or clears it', () => {
		importNotes(PUBLIC, PRIVATE);
		importNotes(PUBLIC);
		expect(listLogbook({ includeNotes: true }).rows[0]?.comment).toBe(PUBLIC);
		expect(listLogbook({ q: PRIVATE, includeNotes: true }).total).toBe(0);
		importNotes(null, null);
		const result = listLogbook({ includeNotes: true });
		expect(result.total).toBe(1);
		expect(result.rows[0]?.comment).toBeNull();
	});
});
