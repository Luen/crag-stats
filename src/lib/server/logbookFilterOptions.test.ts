import { beforeEach, expect, it } from 'vitest';
import { LOGBOOK_TICKS, includeSelectedOptions } from '#lib/logbookFilters';
import { upsertAscents } from './ingest';
import { listLogbook, wipeAllData } from './analytics';
beforeEach(() => wipeAllData());
it('offers supported top-rope/solo ticks and preserves legacy deep links', () => {
	expect(LOGBOOK_TICKS).toEqual(
		expect.arrayContaining(['Top rope', 'Roped solo', 'Lead solo', 'Aid solo'])
	);
	expect(includeSelectedOptions(LOGBOOK_TICKS, ['Custom tick'])).toContain('Custom tick');
});
it.each(['dws', 'deep-water-solo'])('matches %s as Deep water solo on route or ascent', (style) => {
	upsertAscents(
		[0, 1].map((i) => ({
			provider: 'thecrag',
			externalId: 'a' + i,
			ascentDate: '2026-01-01',
			isSend: true,
			isAttempt: false,
			ascentGearStyle: i ? style : null,
			route: {
				provider: 'thecrag',
				externalId: 'r' + i,
				name: 'Synthetic',
				gearStyle: i ? 'Sport' : style
			}
		}))
	);
	expect(listLogbook({ styles: ['Deep water solo'] }).total).toBe(2);
});
