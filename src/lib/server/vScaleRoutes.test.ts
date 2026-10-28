/**
 * #72: V-graded routes that aren't boulders (deep water solos, highballs) must stay on the
 * V-scale everywhere, never shown or ranked as Ewbank numbers.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { usesVScale } from '#lib/grades';
import { getDashboardStats } from './analytics';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

describe('usesVScale', () => {
	it('trusts the stored grade system before the gear style', () => {
		expect(usesVScale('v_scale', 'DWS')).toBe(true);
		expect(usesVScale('font', 'Sport')).toBe(true);
		expect(usesVScale('ewbank', 'Boulder')).toBe(false);
		expect(usesVScale('french', 'Sport')).toBe(false);
	});

	it('falls back to gear style when the system is unknown', () => {
		expect(usesVScale('unknown', 'Boulder')).toBe(true);
		expect(usesVScale(null, 'Boulder')).toBe(true);
		expect(usesVScale(null, 'DWS')).toBe(false);
		expect(usesVScale(undefined, undefined)).toBe(false);
	});
});

// In-memory DB (vitest.config.ts): the sample logbook plus one synthetic V1 deep water solo.
beforeAll(() => {
	const sample = readFileSync('samples/thecrag-logbook-sample.csv', 'utf8');
	const header = sample.split(/\r?\n/)[0];
	const cols = header.split(',');
	const values: Record<string, string> = {
		'Route Name': 'Synthetic DWS',
		'Ascent ID': '9000001',
		'Ascent Type': 'Onsight',
		'Route Grade': 'V1',
		'Route Gear Style': 'DWS',
		'Ascent Gear Style': 'DWS',
		'# Ascents': '1',
		'Route ID': '9000002',
		Country: 'Australia',
		'Crag Name': 'Sea Cliff',
		'Ascent Date': '2025-02-01T00:00:00Z',
		'Log Date': '2025-02-01T00:00:00Z'
	};
	const row = cols.map((c) => values[c] ?? '').join(',');
	upsertAscents(parseTheCragCsv(Buffer.from(`${sample.trimEnd()}\n${row}\n`)));
});

describe('a V-graded deep water solo', () => {
	it('gets its own V-scale pyramid instead of an Ewbank "1"', () => {
		const pyramids = getDashboardStats('ewbank').stylePyramidsByMode.sends;
		const dws = pyramids.find((p) => p.style.startsWith('DWS'));
		expect(dws?.style).toBe('DWS · V');
		expect(dws?.system).toBe('v_scale');
		expect(dws?.rows.map((r) => r.grade)).toEqual(['V1']);
		// The logbook link filters by the real style.
		expect(dws?.rows[0].href).toContain('style=DWS&');
		// Ewbank route pyramids never contain it.
		for (const p of pyramids.filter((x) => !x.style.startsWith('DWS') && x.style !== 'Boulder')) {
			expect(p.system).not.toBe('v_scale');
		}
	});

	it('ranks with boulders in hardest sends and is labelled V1', () => {
		const sends = getDashboardStats('ewbank').hardestSends;
		const dws = sends.find((s) => s.routeName === 'Synthetic DWS');
		expect(dws?.discipline).toBe('boulder');
		expect(dws?.gradeLabel).toBe('V1');
		// V1 is the Experienced band on the V-scale, not Beginner (Ewbank 1).
		expect(dws?.gradeBand).toBe(3);
	});
});
