import { describe, expect, it } from 'vitest';
import {
	canonicalTickKey,
	detectCurrentPreset,
	getTickBehavior,
	groupTicksByCategory,
	isTickCountedInAnalytics,
	isTickCountedInProjectsAndGoals,
	parseTickTypeSettings,
	presetSettings,
	serializeTickTypeSettings,
	STANDARD_TICKS
} from './tickSettings';

describe('canonicalTickKey', () => {
	it('normalizes spacing and casing', () => {
		expect(canonicalTickKey('  Working  ')).toBe('working');
		expect(canonicalTickKey('Red Point')).toBe('red point');
		expect(canonicalTickKey('redpoint')).toBe('red point');
		expect(canonicalTickKey('hangdog')).toBe('hang dog');
		expect(canonicalTickKey('Hang Dog')).toBe('hang dog');
		expect(canonicalTickKey('toprope')).toBe('top rope');
		expect(canonicalTickKey(null)).toBe('');
		expect(canonicalTickKey('')).toBe('');
	});
});

describe('parseTickTypeSettings and serializeTickTypeSettings', () => {
	it('parses valid settings and cleans up defaults', () => {
		const raw = JSON.stringify({
			working: 'projects_goals',
			attempt: 'hide',
			onsight: 'enable',
			invalid: 'something_else'
		});
		const parsed = parseTickTypeSettings(raw);
		expect(parsed).toEqual({
			working: 'projects_goals',
			attempt: 'hide'
		});
		expect(serializeTickTypeSettings(parsed)).toBe(
			JSON.stringify({ working: 'projects_goals', attempt: 'hide' })
		);
	});

	it('handles empty or malformed strings gracefully', () => {
		expect(parseTickTypeSettings(null)).toEqual({});
		expect(parseTickTypeSettings('')).toEqual({});
		expect(parseTickTypeSettings('{invalid json')).toEqual({});
		expect(parseTickTypeSettings('[]')).toEqual({});
	});
});

describe('getTickBehavior and filtering predicates', () => {
	it('defaults to enable when unconfigured', () => {
		expect(getTickBehavior('Working', {})).toBe('enable');
		expect(getTickBehavior('Working', null)).toBe('enable');
		expect(isTickCountedInAnalytics('Working', {})).toBe(true);
		expect(isTickCountedInProjectsAndGoals('Working', {})).toBe(true);
	});

	it('respects projects_goals (hide from analytics, use for projects & goals)', () => {
		const settings = { working: 'projects_goals' as const };
		expect(getTickBehavior('Working', settings)).toBe('projects_goals');
		expect(getTickBehavior('working', settings)).toBe('projects_goals');
		expect(isTickCountedInAnalytics('Working', settings)).toBe(false);
		expect(isTickCountedInProjectsAndGoals('Working', settings)).toBe(true);
		// Other ticks default to enable
		expect(isTickCountedInAnalytics('Onsight', settings)).toBe(true);
		expect(isTickCountedInProjectsAndGoals('Onsight', settings)).toBe(true);
	});

	it('respects hide (hide completely)', () => {
		const settings = { dab: 'hide' as const };
		expect(getTickBehavior('Dab', settings)).toBe('hide');
		expect(isTickCountedInAnalytics('Dab', settings)).toBe(false);
		expect(isTickCountedInProjectsAndGoals('Dab', settings)).toBe(false);
	});

	it('treats null or empty tick as enable', () => {
		expect(isTickCountedInAnalytics(null, { working: 'hide' })).toBe(true);
		expect(isTickCountedInProjectsAndGoals(undefined, { working: 'hide' })).toBe(true);
	});
});

describe('presets', () => {
	it('generates presets correctly', () => {
		expect(presetSettings('all')).toEqual({});
		const sendsOnly = presetSettings('sends_only');
		expect(sendsOnly['working']).toBe('projects_goals');
		expect(sendsOnly['attempt']).toBe('projects_goals');
		expect(sendsOnly['hang dog']).toBe('projects_goals');
		expect(sendsOnly['onsight']).toBeUndefined();

		const excludeWorking = presetSettings('exclude_working');
		expect(excludeWorking).toEqual({ working: 'projects_goals' });
	});

	it('detects presets correctly', () => {
		expect(detectCurrentPreset({})).toBe('all');
		expect(detectCurrentPreset({ onsight: 'enable' })).toBe('all');
		expect(detectCurrentPreset({ working: 'projects_goals' })).toBe('exclude_working');
		expect(detectCurrentPreset(presetSettings('sends_only'))).toBe('sends_only');
		expect(detectCurrentPreset({ working: 'hide' })).toBe('custom');
	});
});

describe('groupTicksByCategory', () => {
	it('groups standard ticks by category in expected order', () => {
		const groups = groupTicksByCategory(STANDARD_TICKS);
		expect(groups.map((g) => g.category)).toEqual(['send', 'solo', 'attempt']);
		expect(groups[0].ticks.some((t) => t.key === 'onsight')).toBe(true);
		expect(groups[2].ticks.some((t) => t.key === 'working')).toBe(true);
	});
});
