import { beforeEach, expect, it } from 'vitest';
import { getDashboardStats, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';

beforeEach(() => wipeAllData());
function add(name: string, ascentDate: string | null, logDate: string | null) {
	upsertAscents([
		{
			provider: 'thecrag',
			externalId: name,
			ascentDate,
			logDate,
			isSend: true,
			isAttempt: false,
			route: { provider: 'thecrag', externalId: `route-${name}`, name, gearStyle: 'Sport' }
		}
	]);
}
it('orders climbing days first, then log times within the day while preserving displayed ascent dates', () => {
	add('Logged first', '2026-10-31T20:00:00Z', '2026-11-01T08:00:00Z');
	add('Logged second', '2026-10-31T01:00:00Z', '2026-11-01T09:00:00Z');
	add('Backdated', '2026-10-30', '2026-11-02T12:00:00Z');
	add('New day', '2026-11-01', '2026-11-01T00:00:00Z');
	const recent = getDashboardStats().recent;
	expect(recent.map((r) => r.routeName)).toEqual([
		'New day',
		'Logged second',
		'Logged first',
		'Backdated'
	]);
	expect(recent.find((r) => r.routeName === 'Logged second')?.ascentDate).toBe(
		'2026-10-31T01:00:00Z'
	);
});
it('compares logging instants across offsets and falls back deterministically for missing, invalid or equal times', () => {
	add('Offset later', '2026-10-31', '2026-11-01T09:00:00+02:00'); // 07:00 UTC
	add('UTC earlier', '2026-10-31', '2026-11-01T06:30:00Z');
	add('Equal instant', '2026-10-31', '2026-11-01T07:00:00Z');
	add('Unzoned UTC', '2026-10-31', '2026-11-01T07:30:00');
	add('Missing', '2026-10-31', null);
	add('Invalid', '2026-10-31', 'not-a-date');
	add('Impossible', '2026-10-31', '2026-11-31T08:00:00Z');
	add('No log clock', '2026-10-31', '2026-11-01');
	add('No climb day', null, '2026-11-02T08:00:00Z');
	expect(getDashboardStats().recent.map((r) => r.routeName)).toEqual([
		'Unzoned UTC',
		'Equal instant',
		'Offset later',
		'UTC earlier',
		'No log clock',
		'Impossible',
		'Invalid',
		'Missing',
		'No climb day'
	]);
});
it('orders the whole set before applying the existing twenty-ascent limit', () => {
	for (let i = 21; i >= 0; i--)
		add(`Climb ${i}`, '2026-10-31', `2026-11-01T${String(i).padStart(2, '0')}:00:00Z`);
	const recent = getDashboardStats().recent;
	expect(recent).toHaveLength(20);
	expect(recent.map((r) => r.routeName)).toEqual(
		Array.from({ length: 20 }, (_, i) => `Climb ${21 - i}`)
	);
});
