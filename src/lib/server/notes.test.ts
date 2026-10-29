import { describe, expect, it } from 'vitest';
import { notesVisible, privateNotesSyncAvailable, resolveShowNotes } from './notes';

describe('resolveShowNotes', () => {
	it('is off by default', () => {
		expect(resolveShowNotes({ stored: null })).toEqual({
			enabled: false,
			source: 'default'
		});
	});

	it('reads the Settings toggle', () => {
		expect(resolveShowNotes({ stored: 'on' })).toEqual({
			enabled: true,
			source: 'settings'
		});
		expect(resolveShowNotes({ stored: 'off' })).toEqual({
			enabled: false,
			source: 'settings'
		});
	});

	it('treats unknown stored values as off', () => {
		expect(resolveShowNotes({ stored: 'maybe' })).toEqual({
			enabled: false,
			source: 'default'
		});
	});
});

describe('privateNotesSyncAvailable', () => {
	it('is false for CSV-only sync', () => {
		expect(privateNotesSyncAvailable('csv')).toBe(false);
		expect(privateNotesSyncAvailable('api')).toBe(true);
		expect(privateNotesSyncAvailable('invalid')).toBe(true);
	});
});

describe('notesVisible', () => {
	it('needs both the setting and an admin viewer', () => {
		expect(notesVisible(true, true)).toBe(true);
		expect(notesVisible(true, false)).toBe(false);
		expect(notesVisible(false, true)).toBe(false);
	});
});
