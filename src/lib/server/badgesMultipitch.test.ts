import { beforeEach, expect, it } from 'vitest';
import { getDashboardStats, wipeAllData } from './analytics';
import { upsertAscents } from './ingest';
import { mapAscent } from './providers/thecrag/api';
import { sentPitchNumbersFromRaw } from './badges';

beforeEach(() => wipeAllData());

it('uses cached per-pitch send ticks through ingest and dashboard analytics', () => {
	const input = (ticks: string[]) => ({
		id: 987,
		date: '2024-04-01',
		tick: { name: 'Tick' },
		pitch: ticks.map((name, i) => ({ number: i + 1, grade: '18', tick: { name } })),
		route: { id: 987, name: 'Synthetic multipitch', grade: '18', style: 'Trad' }
	});
	upsertAscents([mapAscent(input(['Onsight', 'Attempt', 'Hang dog']))!]);
	expect(getDashboardStats().badges.earned.some((b) => b.id === 'multipitch_day')).toBe(false);
	upsertAscents([mapAscent(input(['Onsight', 'Red point', 'Tick']))!]);
	expect(getDashboardStats().badges.earned.some((b) => b.id === 'multipitch_day')).toBe(true);
});

it('ignores absent pitch data and never treats attempts as sent pitches', () => {
	expect(sentPitchNumbersFromRaw(null)).toBeNull();
	expect(sentPitchNumbersFromRaw('{')).toBeNull();
	expect(sentPitchNumbersFromRaw('{}')).toBeNull();
	expect(
		sentPitchNumbersFromRaw(
			JSON.stringify({
				pitch: [
					{ number: 1, tick: { name: 'Attempt' } },
					{ number: 2, tick: { name: 'Red point' } }
				]
			})
		)
	).toEqual([2]);
});
