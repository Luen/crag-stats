import { describe, expect, it } from 'vitest';
import {
	buildRouteRepeats,
	repeatPersona,
	repeatRecentFrom,
	routeRepeatKey,
	REPEAT_MIN_ASCENTS,
	TOP_REPEATED_LIMIT,
	type RepeatAscentInput
} from './routeRepeats';

function ascent(
	externalId: string,
	date: string,
	extra: Partial<RepeatAscentInput> = {}
): RepeatAscentInput {
	return {
		date,
		routeProvider: 'thecrag',
		routeExternalId: externalId,
		routeId: Number(externalId.replace(/\D/g, '')) || null,
		routeName: `Route ${externalId}`,
		cragName: 'Test Crag',
		gearStyle: 'Sport',
		...extra
	};
}

/** `n` first visits on distinct routes, one per day in January 2024. */
function newRoutes(n: number, prefix = 'n', extra: Partial<RepeatAscentInput> = {}) {
	return Array.from({ length: n }, (_, i) =>
		ascent(`${prefix}${i + 1}`, `2024-01-${String((i % 28) + 1).padStart(2, '0')}`, extra)
	);
}

describe('routeRepeatKey', () => {
	it('keys by provider plus external id', () => {
		expect(routeRepeatKey('theCrag', ' 123 ')).toBe('thecrag:123');
		expect(routeRepeatKey('thecrag', null)).toBeNull();
		expect(routeRepeatKey(null, '123')).toBeNull();
		expect(routeRepeatKey('thecrag', '')).toBeNull();
	});
});

describe('repeatPersona', () => {
	it('needs enough ascents for a label', () => {
		expect(repeatPersona(10, 9)).toBeNull();
	});

	it('applies thresholds to exact shares', () => {
		expect(repeatPersona(15, 5)).toBe('explorer'); // exactly 75% new
		expect(repeatPersona(14, 6)).toBe('mixed');
		expect(repeatPersona(10, 10)).toBe('repeater'); // exactly 50% repeats
		expect(repeatPersona(11, 9)).toBe('mixed');
	});
});

describe('repeatRecentFrom', () => {
	it('starts a 365-day window ending today', () => {
		expect(repeatRecentFrom('2024-12-31')).toBe('2024-01-02');
		expect(repeatRecentFrom('2025-03-01')).toBe('2024-03-02');
	});
});

describe('buildRouteRepeats', () => {
	it('hides until there are enough dated ascents', () => {
		expect(buildRouteRepeats(newRoutes(REPEAT_MIN_ASCENTS - 1), '2024-06-01')).toBeNull();
		expect(buildRouteRepeats(newRoutes(REPEAT_MIN_ASCENTS), '2024-06-01')).not.toBeNull();
	});

	it('ignores invalid dates and rows without a provider route id', () => {
		const rows = [
			...newRoutes(REPEAT_MIN_ASCENTS - 1),
			ascent('x1', '2024-02-31'),
			ascent('x2', '0000-01-01'),
			{ ...ascent('x3', '2024-02-01'), routeExternalId: null }
		];
		expect(buildRouteRepeats(rows, '2024-06-01')).toBeNull();
	});

	it('classifies first-day ascents as new and later days as repeats', () => {
		const rows = [
			...newRoutes(18),
			ascent('r1', '2024-02-01'), // an attempt, then …
			ascent('r1', '2024-02-01'), // … a send the same first day: both first visits
			ascent('r1', '2024-02-08'),
			ascent('r1', '2024-02-15')
		];
		const view = buildRouteRepeats(rows, '2024-06-01')!;
		const all = view.allTime.all;
		expect(all.ascents).toBe(22);
		expect(all.newAscents).toBe(20);
		expect(all.repeatAscents).toBe(2);
		expect(all.newPct).toBe(91);
		expect(all.repeatPct).toBe(9);
		expect(all.routes).toBe(19);
		expect(all.repeatedRoutes).toBe(1);
		expect(all.persona).toBe('explorer');
		expect(all.top).toEqual([
			{
				key: 'thecrag:r1',
				routeId: 1,
				routeName: 'Route r1',
				cragName: 'Test Crag',
				days: 3,
				ascents: 4,
				lastDay: '2024-02-15'
			}
		]);
	});

	it('keys routes by provider id, never by name', () => {
		const rows = [
			...newRoutes(18),
			ascent('a', '2024-03-01', { routeName: 'Same Name' }),
			ascent('b', '2024-03-02', { routeName: 'Same Name' })
		];
		const all = buildRouteRepeats(rows, '2024-06-01')!.allTime.all;
		expect(all.repeatAscents).toBe(0);
		expect(all.routes).toBe(20);
	});

	it('uses earliest day even when rows arrive out of order', () => {
		const rows = [
			...newRoutes(18),
			ascent('r1', '2024-04-10'),
			ascent('r1', '2024-02-10'),
			ascent('r1', '2024-03-10')
		];
		const view = buildRouteRepeats(rows, '2024-06-01')!;
		expect(view.allTime.all.repeatAscents).toBe(2);
	});

	it('labels repeat climbers and the mixed middle', () => {
		const repeater = [
			...newRoutes(10),
			...Array.from({ length: 10 }, (_, i) =>
				ascent('n1', `2024-02-${String(i + 1).padStart(2, '0')}`)
			)
		];
		expect(buildRouteRepeats(repeater, '2024-06-01')!.allTime.all.persona).toBe('repeater');

		const mixed = [
			...newRoutes(14),
			...Array.from({ length: 6 }, (_, i) =>
				ascent('n2', `2024-03-${String(i + 1).padStart(2, '0')}`)
			)
		];
		expect(buildRouteRepeats(mixed, '2024-06-01')!.allTime.all.persona).toBe('mixed');
	});

	it('classifies the recent window from the whole history', () => {
		const rows = [
			...newRoutes(20), // all in January 2024
			ascent('n1', '2025-05-01'), // repeat of a 2024 route
			ascent('fresh', '2025-05-02'), // brand new route
			ascent('future', '2025-07-01') // after today: outside recent window
		];
		const view = buildRouteRepeats(rows, '2025-06-01')!;
		expect(view.recentFrom).toBe('2024-06-02');
		const recent = view.last12Months.all;
		expect(recent.ascents).toBe(2);
		expect(recent.repeatAscents).toBe(1);
		expect(recent.newAscents).toBe(1);
		expect(recent.newRoutes).toBe(1);
		expect(recent.routes).toBe(2);
		expect(recent.persona).toBeNull(); // too few ascents for a label
		expect(recent.top.map((r) => r.key)).toEqual(['thecrag:n1']);
		expect(recent.top[0]!.days).toBe(1);
	});

	it('splits Sport / Trad / Boulder by ascent or route style', () => {
		const rows = [
			...newRoutes(18),
			ascent('b1', '2024-02-01', { gearStyle: 'Boulder' }),
			ascent('b1', '2024-02-02', { gearStyle: 'Boulder' }),
			ascent('t1', '2024-02-03', { gearStyle: 'Sport', ascentGearStyle: 'Trad' }),
			ascent('tr', '2024-02-04', { gearStyle: 'Top rope' })
		];
		const view = buildRouteRepeats(rows, '2024-06-01')!;
		expect(view.allTime.boulder.ascents).toBe(2);
		expect(view.allTime.boulder.repeatAscents).toBe(1);
		expect(view.allTime.trad.ascents).toBe(1);
		expect(view.allTime.sport.ascents).toBe(19); // 18 sport + the sport route led on trad
		expect(view.allTime.all.ascents).toBe(22);
	});

	it('ranks most-repeated routes by days, then ascents, then recency', () => {
		const days = (id: string, n: number, month: string, perDay = 1) =>
			Array.from({ length: n }, (_, i) =>
				Array.from({ length: perDay }, () =>
					ascent(id, `2024-${month}-${String(i + 1).padStart(2, '0')}`)
				)
			).flat();
		const rows = [
			...newRoutes(5),
			...days('a1', 3, '02'),
			...days('b2', 5, '03'),
			...days('c3', 3, '04', 2),
			...days('d4', 3, '05'),
			...days('e5', 2, '06'),
			...days('f6', 2, '07'),
			...days('g7', 1, '08') // single day: never in the list
		];
		const top = buildRouteRepeats(rows, '2024-12-01')!.allTime.all.top;
		expect(top.map((r) => r.key)).toEqual([
			'thecrag:b2',
			'thecrag:c3',
			'thecrag:d4',
			'thecrag:a1',
			'thecrag:f6'
		]);
		expect(top).toHaveLength(TOP_REPEATED_LIMIT);
	});
});
