import { describe, expect, it } from 'vitest';
import {
	climbersMentionLogin,
	historyTypeToKind,
	normalizeHistoryEntries,
	ownerKindsFromHistory
} from './routeHistoryParse';

describe('historyTypeToKind', () => {
	it('maps FA and FFA labels', () => {
		expect(historyTypeToKind('First Ascent')).toBe('FA');
		expect(historyTypeToKind('First Free Ascent')).toBe('FFA');
		expect(historyTypeToKind('first_free_ascent')).toBe('FFA');
		expect(historyTypeToKind('FA')).toBe('FA');
		expect(historyTypeToKind('Route Setter')).toBeNull();
		expect(historyTypeToKind('')).toBeNull();
	});
});

describe('climbersMentionLogin', () => {
	it('matches @login tokens only', () => {
		expect(climbersMentionLogin('@luenwarneke', 'luenwarneke')).toBe(true);
		expect(climbersMentionLogin('@LuenWarneke,richard lim', 'luenwarneke')).toBe(true);
		expect(climbersMentionLogin('@jackheenan & @luenwarneke', 'luenwarneke')).toBe(true);
		expect(climbersMentionLogin('Luke Middleton', 'luenwarneke')).toBe(false);
		expect(climbersMentionLogin('@jackheenan', 'luenwarneke')).toBe(false);
		expect(climbersMentionLogin('@luenwarneke', null)).toBe(false);
		expect(climbersMentionLogin('@luenwarneke', '')).toBe(false);
	});
});

describe('ownerKindsFromHistory', () => {
	it('prefers FFA when both mention the owner', () => {
		expect(
			ownerKindsFromHistory(
				[
					{ id: '1', type: 'First Ascent', climbers: '@luenwarneke', date: null },
					{ id: '2', type: 'First Free Ascent', climbers: '@luenwarneke', date: null }
				],
				'luenwarneke'
			)
		).toBe('FFA');
	});

	it('ignores free-text FA climbers', () => {
		expect(
			ownerKindsFromHistory(
				[{ id: '1', type: 'First Ascent', climbers: 'Luke Middleton', date: '2016-00-00' }],
				'luenwarneke'
			)
		).toBeNull();
	});
});

describe('normalizeHistoryEntries', () => {
	it('keeps only rows with id and type', () => {
		expect(
			normalizeHistoryEntries([
				{ id: 1, type: 'First Ascent', climbers: '@a', date: '2019-11-00T00:00:00Z' },
				{ type: 'First Ascent' },
				null
			])
		).toEqual([
			{
				id: '1',
				type: 'First Ascent',
				climbers: '@a',
				date: '2019-11-00T00:00:00Z'
			}
		]);
	});
});
