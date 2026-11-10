import { describe, expect, it } from 'vitest';
import { buildGradeRecords } from './gradeRecords';

const systems = { route: 'french', boulder: 'font' } as const;
const row = {
	id: 1,
	isSend: true,
	tickType: 'Red point',
	gradeScore: 20,
	effectiveGradeScore: null,
	gradeSystem: 'ewbank',
	gearStyle: 'Sport',
	routeName: 'Record route',
	href: 'https://www.thecrag.com/ascent/123'
};

describe('dashboard grade records', () => {
	it('ranks sends separately from first-go sends and excludes attempts', () => {
		const result = buildGradeRecords(
			[
				row,
				{ ...row, id: 2, gradeScore: 19, tickType: 'Flash' },
				{ ...row, id: 3, gradeScore: 18, tickType: 'Onsight' },
				{ ...row, id: 4, gradeScore: 35, isSend: false, tickType: 'Onsight' }
			],
			systems
		);
		expect(result.sends).toEqual([
			{
				discipline: 'route',
				grade: '6b',
				tick: 'Red point',
				routeName: row.routeName,
				href: row.href
			}
		]);
		expect(result.onsightFlash[0]).toMatchObject({ grade: '6a+', tick: 'Flashed' });
	});
	it('uses effective climbed-pitch grades rather than a harder full route', () => {
		const result = buildGradeRecords(
			[row, { ...row, id: 2, gradeScore: 30, effectiveGradeScore: 17, tickType: 'Onsight' }],
			systems
		);
		expect(result.sends[0].grade).toBe('6b');
		expect(result.onsightFlash[0].grade).toBe('5b+');
	});
	it('keeps route and V-graded DWS records separate, including negative V grades', () => {
		const result = buildGradeRecords(
			[
				row,
				{
					...row,
					id: 2,
					gradeScore: -1,
					gradeSystem: 'v_scale',
					gearStyle: 'DWS',
					tickType: 'Flash'
				}
			],
			{ route: 'yds', boulder: 'v_scale' }
		);
		expect(result.sends.map((r) => r.discipline)).toEqual(['route', 'boulder']);
		expect(result.onsightFlash[0]).toMatchObject({ discipline: 'boulder', grade: 'VB' });
	});
	it('prefers an onsight at the same first-go grade without depending on input order', () => {
		const flash = { ...row, tickType: 'Flash' };
		const onsight = { ...row, id: 2, tickType: 'Onsight' };
		expect(buildGradeRecords([flash, onsight], systems).onsightFlash[0].tick).toBe('Onsighted');
		expect(buildGradeRecords([onsight, flash], systems).onsightFlash[0].tick).toBe('Onsighted');
	});
	it('leaves missing or nonfinite evidence empty and never infers a first-go send', () => {
		expect(
			buildGradeRecords(
				[
					{ ...row, gradeScore: null },
					{ ...row, gradeScore: NaN }
				],
				systems
			)
		).toEqual({ sends: [], onsightFlash: [] });
		expect(buildGradeRecords([row], systems).onsightFlash).toEqual([]);
	});
});
