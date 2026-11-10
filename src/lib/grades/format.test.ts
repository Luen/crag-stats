import { describe, expect, it } from 'vitest';
import { convertFromEwbank, convertFromVScale } from './conversions';
import {
	applyDisplaySystemOverrides,
	DEFAULT_DISPLAY_SYSTEMS,
	displaySystemsFromLegacy,
	formatGradeLabel,
	formatClimbGrade,
	resolveDisplaySystems
} from './format';

describe('displaySystemsFromLegacy', () => {
	it.each([
		['ewbank', { route: 'ewbank', boulder: 'v_scale' }],
		['french', { route: 'french', boulder: 'v_scale' }],
		['yds', { route: 'yds', boulder: 'v_scale' }],
		['v_scale', { route: 'ewbank', boulder: 'v_scale' }],
		['font', { route: 'ewbank', boulder: 'font' }],
		[null, { route: 'ewbank', boulder: 'v_scale' }],
		['uiaa', { route: 'ewbank', boulder: 'v_scale' }]
	])('maps legacy %s to what it used to display', (legacy, expected) => {
		expect(displaySystemsFromLegacy(legacy)).toEqual(expected);
	});
});

describe('resolveDisplaySystems', () => {
	it('defaults to Ewbank routes and V-scale boulders', () => {
		expect(resolveDisplaySystems({})).toEqual(DEFAULT_DISPLAY_SYSTEMS);
	});

	it('prefers the split keys and falls back to the legacy value per kind', () => {
		expect(resolveDisplaySystems({ route: 'french', boulder: 'font', legacy: 'yds' })).toEqual({
			route: 'french',
			boulder: 'font'
		});
		expect(resolveDisplaySystems({ route: 'yds', legacy: 'font' })).toEqual({
			route: 'yds',
			boulder: 'font'
		});
		expect(resolveDisplaySystems({ boulder: 'font', legacy: 'french' })).toEqual({
			route: 'french',
			boulder: 'font'
		});
	});

	it('ignores values of the wrong kind in a split key', () => {
		expect(resolveDisplaySystems({ route: 'font', boulder: 'french', legacy: 'yds' })).toEqual({
			route: 'yds',
			boulder: 'v_scale'
		});
	});
});

describe('applyDisplaySystemOverrides', () => {
	const base = { route: 'french', boulder: 'font' } as const;
	const apply = (query: string) => applyDisplaySystemOverrides(base, new URLSearchParams(query));

	it('applies ?system= to routes or boulders by kind', () => {
		expect(apply('system=yds')).toEqual({ route: 'yds', boulder: 'font' });
		expect(apply('system=v_scale')).toEqual({ route: 'french', boulder: 'v_scale' });
	});

	it('applies ?boulderSystem= and ignores unknown values', () => {
		expect(apply('system=ewbank&boulderSystem=v_scale')).toEqual({
			route: 'ewbank',
			boulder: 'v_scale'
		});
		expect(apply('system=uiaa&boulderSystem=french')).toEqual(base);
	});
});

describe('formatGradeLabel with mixed systems', () => {
	const frenchFont = { route: 'french', boulder: 'font' } as const;

	it('shows French routes and Font boulders together', () => {
		expect(formatGradeLabel(24, false, frenchFont)).toBe(convertFromEwbank(24, 'french'));
		expect(formatGradeLabel(5, true, frenchFont)).toBe(convertFromVScale(5, 'font'));
	});

	it('shows YDS routes with V-scale boulders', () => {
		const ydsV = { route: 'yds', boulder: 'v_scale' } as const;
		expect(formatGradeLabel(24, false, ydsV)).toBe(convertFromEwbank(24, 'yds'));
		expect(formatGradeLabel(5, true, ydsV)).toBe('V5');
	});
});

describe('individual climb grades', () => {
	const systems = { route: 'french', boulder: 'font' } as const;
	const route = { gradeScore: 20, gradeRaw: '20', gradeSystem: 'ewbank', gearStyle: 'Sport' };

	it('converts a route and retains its original grade once', () => {
		expect(formatClimbGrade(route, systems)).toBe('6b (20)');
		expect(formatClimbGrade({ ...route, gradeRaw: '6b' }, systems)).toBe('6b');
		expect(formatClimbGrade(route, DEFAULT_DISPLAY_SYSTEMS)).toBe('20');
	});

	it('uses the boulder preference for V-graded DWS', () => {
		expect(
			formatClimbGrade(
				{ gradeScore: 3, gradeRaw: 'V3', gradeSystem: 'v_scale', gearStyle: 'DWS' },
				systems
			)
		).toBe('6A (V3)');
	});

	it('keeps the climbed pitch primary and the route grade as context', () => {
		expect(
			formatClimbGrade(
				{
					...route,
					gradeRaw: '25',
					gradeScore: 25,
					effectiveGradeScore: 18,
					effectiveGradeRaw: '18'
				},
				systems
			)
		).toBe('5c+ (25)');
	});

	it('preserves unscored and ungraded routes without inventing a grade', () => {
		expect(formatClimbGrade({ ...route, gradeScore: null, gradeRaw: 'VIIa' }, systems)).toBe(
			'VIIa'
		);
		expect(formatClimbGrade({ ...route, gradeScore: null, gradeRaw: null }, systems)).toBeNull();
	});
});
