import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DisplayGradeSystems } from '#lib/grades';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

beforeEach(() => wipeAllData());

function seed(grades: string[], style: string, offset = 0) {
	const header = readFileSync('samples/thecrag-logbook-sample.csv', 'utf8').split(/\r?\n/)[0];
	const rows = grades.map((grade, i) => {
		const values: Record<string, string> = {
			'Route Name': `Native ${grade}`,
			'Ascent ID': String(9100001 + offset + i),
			'Ascent Type': 'Redpoint',
			'Route Grade': grade,
			'Route Gear Style': style,
			'Ascent Gear Style': style,
			'Route ID': String(9100101 + offset + i),
			Country: 'France',
			'Ascent Date': '2025-03-01T00:00:00Z'
		};
		return header
			.split(',')
			.map((c) => values[c] ?? '')
			.join(',');
	});
	upsertAscents(parseTheCragCsv(Buffer.from(`${header}\n${rows.join('\n')}\n`)));
}

const systems: DisplayGradeSystems = { route: 'french', boulder: 'font' };

describe('native pyramid rows', () => {
	it.each([
		{ display: systems, style: 'Sport', grades: ['6a', '6a+', '6c', '6c+'] },
		{
			display: { route: 'yds', boulder: 'font' } as DisplayGradeSystems,
			style: 'Sport',
			grades: ['5.10c', '5.10d', '5.11a']
		},
		{ display: systems, style: 'Boulder', grades: ['6A', '6A+', '6B', '6B+'] }
	])(
		'labels $grades and links only their own ascents with $display',
		({ display, style, grades }) => {
			seed(grades, style);
			const pyramid = getDashboardStats(display).stylePyramidsByMode.sends.find(
				(p) => p.style === style
			)!;
			expect(pyramid.rows.map((r) => r.grade)).toEqual(grades);
			for (const row of pyramid.rows) {
				const params = new URL(row.href, 'http://x').searchParams;
				const listed = listLogbook({
					style,
					tcMin: Number(params.get('tcMin')),
					tcMax: Number(params.get('tcMax'))
				});
				expect(listed.rows.map((r) => r.routeName)).toEqual([`Native ${row.grade}`]);
			}
		}
	);

	it('uses independent French and Font rows together', () => {
		seed(['6a', '6a+'], 'Sport');
		seed(['6A', '6A+'], 'Boulder', 100);
		const pyramids = getDashboardStats(systems).stylePyramidsByMode.sends;
		expect(pyramids.find((p) => p.style === 'Sport')!.rows.map((r) => r.grade)).toEqual([
			'6a',
			'6a+'
		]);
		expect(pyramids.find((p) => p.style === 'Boulder')!.rows.map((r) => r.grade)).toEqual([
			'6A',
			'6A+'
		]);
	});

	it('keeps route-scaled and V-scaled DWS out of each other’s row links', () => {
		seed(['22', 'V3'], 'DWS');
		const pyramids = getDashboardStats(systems).stylePyramidsByMode.sends;
		expect(pyramids).toHaveLength(2);
		for (const pyramid of pyramids) {
			const params = new URL(pyramid.rows[0].href, 'http://x').searchParams;
			const gradeScale = params.get('gradeScale') as 'route' | 'v';
			expect(gradeScale).toBe(pyramid.style.endsWith(' · V') ? 'v' : 'route');
			const listed = listLogbook({
				style: 'DWS',
				gradeScale,
				tcMin: Number(params.get('tcMin')),
				tcMax: Number(params.get('tcMax'))
			});
			expect(listed.rows.map((r) => r.routeName)).toEqual([
				gradeScale === 'v' ? 'Native V3' : 'Native 22'
			]);
		}
	});

	it('keeps whole Ewbank and V score links', () => {
		seed(['18', '19'], 'Sport');
		seed(['V0', 'V1'], 'Boulder', 100);
		const pyramids = getDashboardStats({ route: 'ewbank', boulder: 'v_scale' }).stylePyramidsByMode
			.sends;
		expect(pyramids).toHaveLength(2);
		for (const pyramid of pyramids) {
			expect(pyramid.rows).not.toHaveLength(0);
			expect(pyramid.rows.every((r) => new URL(r.href, 'http://x').searchParams.has('score'))).toBe(
				true
			);
		}
	});
});
