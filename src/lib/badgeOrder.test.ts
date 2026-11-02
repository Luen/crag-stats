import { describe, expect, it } from 'vitest';
import { sortEarnedBadges } from './badgeOrder';

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe('sortEarnedBadges', () => {
	it('puts the most recent climb first', () => {
		const sorted = sortEarnedBadges([
			{ id: 'first_send', date: '2018-04-22' },
			{ id: 'height_20km', date: '2026-05-26' },
			{ id: 'fa_sport_20', date: '2026-10-24' },
			{ id: 'ascents_500', date: '2020-02-05' }
		]);
		expect(ids(sorted)).toEqual(['fa_sport_20', 'height_20km', 'ascents_500', 'first_send']);
	});

	it('does not pin First Moves ahead of climbs by its import time', () => {
		const sorted = sortEarnedBadges([
			{ id: 'first_moves', date: '2026-10-30T05:22:03.954Z' },
			{ id: 'first_send', date: '2018-04-22' },
			{ id: 'height_20km', date: '2026-05-26' }
		]);
		expect(ids(sorted)).toEqual(['height_20km', 'first_send', 'first_moves']);
	});

	it('keeps catalog order for same-day and undated badges', () => {
		const sorted = sortEarnedBadges([
			{ id: 'community_10', date: null },
			{ id: 'first_session', date: '2018-04-22' },
			{ id: 'first_moves', date: '2026-10-30T05:22:03.954Z' },
			{ id: 'first_send', date: '2018-04-22T00:00:00Z' },
			{ id: 'bad_date', date: '2018-00-00' },
			{ id: 'first_flash', date: '2018-04-22' }
		]);
		expect(ids(sorted)).toEqual([
			'first_session',
			'first_send',
			'first_flash',
			'community_10',
			'first_moves',
			'bad_date'
		]);
	});
});
