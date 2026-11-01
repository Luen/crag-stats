import { beforeEach, expect, it } from 'vitest';
import { SOLO_KINDS, soloKind } from '#lib/soloKind';
import { listLogbook, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';

beforeEach(() => wipeAllData());
it('matches every card category before pagination, including aliases, attempts and tick precedence', () => {
	const examples = [
		['leadsolo', 'solo'],
		['Lead-Solo', 'Sport'],
		['Roped_Solo', 'dws'],
		['Top rope solo', 'Sport'],
		['Aid solo', 'solo'],
		['Onsight', 'free solo'],
		['Attempt', 'solo'],
		['Onsight', 'deep water solo'],
		['Red point', 'dws'],
		['Red point', 'Sport']
	];
	const entries = examples.map(([tickType, ascentGearStyle], i) => ({
		provider: 'thecrag',
		externalId: `solo-${i}`,
		ascentDate: '2026-01-01',
		tickType,
		ascentGearStyle,
		isSend: i !== 6,
		isAttempt: i === 6,
		route: {
			provider: 'thecrag',
			externalId: `solo-route-${i}`,
			name: `Synthetic ${i}`,
			gearStyle: 'Sport'
		}
	}));
	upsertAscents(entries);
	for (const { kind } of SOLO_KINDS) {
		const expected = entries
			.filter((r) => soloKind(r) === kind)
			.map((r) => r.externalId)
			.sort();
		const result = listLogbook({ solo: kind });
		expect(result.rows.map((r) => r.externalId).sort()).toEqual(expected);
		expect(result.total).toBe(expected.length);
		expect(listLogbook({ solo: kind, limit: 1, offset: 1 }).total).toBe(expected.length);
	}
	expect(listLogbook({ solo: 'lead', ticks: ['Lead-Solo'] }).total).toBe(1);
	expect(listLogbook({ solo: 'unknown' }).total).toBe(entries.length);
});
