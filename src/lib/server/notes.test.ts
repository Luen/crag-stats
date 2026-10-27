import { describe, expect, it } from 'vitest';
import { notesVisible, resolveShowNotes } from './notes';

describe('resolveShowNotes', () => {
	it('is off by default', () => {
		expect(resolveShowNotes({ stored: null, envValue: '' })).toEqual({
			enabled: false,
			source: 'default'
		});
	});

	it('reads SHOW_PRIVATE_NOTES when Settings has no value', () => {
		for (const v of ['1', 'true', 'YES', ' on ']) {
			expect(resolveShowNotes({ stored: null, envValue: v }).enabled, v).toBe(true);
		}
		for (const v of ['0', 'false', 'no', 'nope']) {
			expect(resolveShowNotes({ stored: null, envValue: v })).toEqual({
				enabled: false,
				source: 'env'
			});
		}
	});

	it('lets the Settings toggle override the env', () => {
		expect(resolveShowNotes({ stored: 'off', envValue: 'true' })).toEqual({
			enabled: false,
			source: 'settings'
		});
		expect(resolveShowNotes({ stored: 'on', envValue: '' }).enabled).toBe(true);
		// Unknown stored values fall through to the env.
		expect(resolveShowNotes({ stored: 'maybe', envValue: '' }).source).toBe('default');
	});
});

describe('notesVisible', () => {
	it('needs both the setting and an admin viewer', () => {
		expect(notesVisible(true, true)).toBe(true);
		expect(notesVisible(true, false)).toBe(false);
		expect(notesVisible(false, true)).toBe(false);
	});
});
