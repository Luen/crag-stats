/**
 * #450: with French display, a 6a send must sit in a "6a" row, not under a neighbouring
 * grade, and the row's logbook link must list only its own ascents.
 */
import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { getDashboardStats, listLogbook } from './analytics';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

const GRADES = ['6a', '6a+', '6c', '6c+'];

beforeAll(() => {
	const sample = readFileSync('samples/thecrag-logbook-sample.csv', 'utf8');
	const cols = sample.split(/\r?\n/)[0].split(',');
	const rows = GRADES.map((grade, i) => {
		const values: Record<string, string> = {
			'Route Name': `Native ${grade}`,
			'Ascent ID': String(9100001 + i),
			'Ascent Type': 'Redpoint',
			'Route Grade': grade,
			'Route Gear Style': 'Sport',
			'Ascent Gear Style': 'Sport',
			'# Ascents': '1',
			'Route ID': String(9100101 + i),
			Country: 'France',
			'Crag Name': 'Native Crag',
			'Ascent Date': '2025-03-01T00:00:00Z',
			'Log Date': '2025-03-01T00:00:00Z'
		};
		return cols.map((c) => values[c] ?? '').join(',');
	});
	upsertAscents(parseTheCragCsv(Buffer.from(`${sample.trimEnd()}\n${rows.join('\n')}\n`)));
});

describe('French pyramid rows', () => {
	it('has one row per French grade, linking only its own ascents', () => {
		const sport = getDashboardStats('french').stylePyramidsByMode.sends.find(
			(p) => p.style === 'Sport'
		);
		const rows = (sport?.rows ?? []).filter((r) => GRADES.includes(r.grade));
		expect(rows.map((r) => r.grade)).toEqual(GRADES);
		for (const row of rows) {
			const params = new URL(row.href, 'http://x').searchParams;
			const listed = listLogbook({
				style: 'Sport',
				tcMin: Number(params.get('tcMin')),
				tcMax: Number(params.get('tcMax'))
			});
			expect(listed.rows.map((r) => r.routeName)).toEqual([`Native ${row.grade}`]);
		}
	});

	it('keeps whole Ewbank rows for Ewbank display', () => {
		const sport = getDashboardStats('ewbank').stylePyramidsByMode.sends.find(
			(p) => p.style === 'Sport'
		);
		expect(sport?.rows.every((r) => new URL(r.href, 'http://x').searchParams.has('score'))).toBe(
			true
		);
	});
});
