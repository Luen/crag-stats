import { describe, expect, it } from 'vitest';
import { classifyTick } from './server/providers/types';
import {
	canonicalTickKey,
	detectCurrentPreset,
	getTickBehavior,
	groupTicksByCategory,
	isTickCountedInAnalytics,
	isTickCountedInProjectsAndGoals,
	parseTickTypeSettings,
	presetSettings,
	presetTickState,
	applyPresetToState,
	sameTickTypeSettings,
	serializeTickTypeSettings,
	STANDARD_TICKS,
	unrenderedChoices,
	type TickTypeSettings
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
		expect(JSON.parse(serializeTickTypeSettings(parsed))).toEqual({
			working: 'projects_goals',
			attempt: 'hide'
		});
	});

	it('serializes the same configuration identically regardless of key order', () => {
		expect(serializeTickTypeSettings({ working: 'projects_goals', attempt: 'hide' })).toBe(
			serializeTickTypeSettings({ attempt: 'hide', working: 'projects_goals' })
		);
		expect(sameTickTypeSettings({ working: 'hide' }, { working: 'hide' })).toBe(true);
		expect(sameTickTypeSettings({ working: 'hide' }, { working: 'projects_goals' })).toBe(false);
		expect(sameTickTypeSettings({}, { attempt: 'hidden' as never })).toBe(true);
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
		// "Top rope" is not a send in this app, so the preset must drop it from totals too.
		expect(sendsOnly['top rope']).toBe('projects_goals');
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

	it('ignores stored choices for ticks the matrix does not render (#476)', () => {
		// A saved hide for a tick type with no logged rows stays live for future climbs,
		// but must not label an all-Enable matrix "custom" — Settings lists it as a
		// leftover choice instead.
		expect(detectCurrentPreset({ 'dab hide': 'hide' }, STANDARD_TICKS)).toBe('all');
		expect(detectCurrentPreset({ 'dab hide': 'projects_goals' }, STANDARD_TICKS)).toBe('all');

		// Rendered choices still decide the preset.
		expect(
			detectCurrentPreset({ working: 'projects_goals', 'dab hide': 'hide' }, STANDARD_TICKS)
		).toBe('exclude_working');
		expect(
			detectCurrentPreset({ ...presetSettings('sends_only'), 'dab hide': 'hide' }, STANDARD_TICKS)
		).toBe('sends_only');
	});

	it('lists unrendered choices for the settings page (#476)', () => {
		const settings: TickTypeSettings = {
			working: 'projects_goals',
			'dab hide': 'hide',
			'old tick': 'projects_goals',
			'never logged': 'enable'
		};
		expect(unrenderedChoices(settings, STANDARD_TICKS)).toEqual([
			['dab hide', 'hide'],
			['old tick', 'projects_goals']
		]);
		expect(unrenderedChoices({ working: 'projects_goals' }, STANDARD_TICKS)).toEqual([]);
		expect(unrenderedChoices({}, STANDARD_TICKS)).toEqual([]);
	});

	it('applying a preset replaces stored choices instead of merging under them', () => {
		const stored: TickTypeSettings = { working: 'hide', attempt: 'hide' };
		// Merging `presetSettings('all')` (empty) under stored choices would keep both hides.
		const all = { ...stored, ...presetTickState('all', STANDARD_TICKS) };
		expect(all['working']).toBe('enable');
		expect(all['attempt']).toBe('enable');
		expect(detectCurrentPreset(all, STANDARD_TICKS)).toBe('all');

		const sendsOnly = { ...stored, ...presetTickState('sends_only', STANDARD_TICKS) };
		expect(sendsOnly['working']).toBe('projects_goals');
		expect(sendsOnly['onsight']).toBe('enable');
		expect(detectCurrentPreset(sendsOnly, STANDARD_TICKS)).toBe('sends_only');
	});

	it('presetTickState covers every available tick, including provider-only names', () => {
		const available = [
			...STANDARD_TICKS,
			{ key: 'second', name: 'Second', category: 'other' as const, isSend: true }
		];
		const state = presetTickState('sends_only', available);
		expect(state['second']).toBe('enable');
		expect(state['working']).toBe('projects_goals');
		expect(Object.keys(state)).toHaveLength(available.length);
	});

	it('applyPresetToState clears stored choices for ticks that are not rendered', () => {
		// 'dab hide' is stored for a provider-only tick that has no logged rows, so the
		// settings page renders no radio for it — "All logged ticks" must still clear it.
		const current: TickTypeSettings = { working: 'hide', 'dab hide': 'hide' };
		const all = applyPresetToState('all', current, STANDARD_TICKS);
		expect(all['working']).toBe('enable');
		expect(all['dab hide']).toBe('enable');
		expect(detectCurrentPreset(all, STANDARD_TICKS)).toBe('all');

		// Other presets only describe the rendered matrix: the unrendered key is
		// simply absent from the override state, so the stored choice survives the
		// component's merge instead of guessing its send/attempt classification.
		const sendsOnly = applyPresetToState('sends_only', current, STANDARD_TICKS);
		expect(sendsOnly['working']).toBe('projects_goals');
		expect(sendsOnly['dab hide']).toBeUndefined();
	});
});

describe('groupTicksByCategory', () => {
	it('groups standard ticks by category in expected order', () => {
		const groups = groupTicksByCategory(STANDARD_TICKS);
		expect(groups.map((g) => g.category)).toEqual(['send', 'solo', 'attempt', 'other']);
		expect(groups[0].ticks.some((t) => t.key === 'onsight')).toBe(true);
		expect(groups[2].ticks.some((t) => t.key === 'working')).toBe(true);
	});
});

describe('STANDARD_TICKS', () => {
	it('classifies every tick the same way as the logbook', () => {
		// A hard-coded send/attempt flag that disagrees here would make "Sends only"
		// hide real sends or leave attempts in the headline totals.
		for (const tick of STANDARD_TICKS) {
			expect(classifyTick(tick.name).isSend, tick.name).toBe(tick.isSend);
		}
	});
});
