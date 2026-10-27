import { describe, expect, it } from 'vitest';
import { pickHardestSends, type Discipline } from './hardestSends';

type Row = { name: string; score: number | null; d: Discipline };
const pick = (rows: Row[], limit?: number) =>
	pickHardestSends(
		rows,
		(r) => r.score,
		(r) => r.d,
		limit
	).map((x) => x.row.name);

const routes = (n: number, from = 25): Row[] =>
	Array.from({ length: n }, (_, i) => ({ name: `r${from - i}`, score: from - i, d: 'route' }));
const boulders = (n: number, from = 8): Row[] =>
	Array.from({ length: n }, (_, i) => ({ name: `V${from - i}`, score: from - i, d: 'boulder' }));

describe('pickHardestSends', () => {
	it('keeps boulders even though V scores are numerically lower than Ewbank (#58)', () => {
		expect(pick([...routes(8), ...boulders(8)])).toEqual([
			'r25',
			'r24',
			'r23',
			'r22',
			'r21',
			'V8',
			'V7',
			'V6',
			'V5',
			'V4'
		]);
	});

	it('gives spare slots to the other discipline', () => {
		expect(pick([...routes(10), ...boulders(2)])).toHaveLength(10);
		expect(pick([...routes(10), ...boulders(2)]).slice(-2)).toEqual(['V8', 'V7']);
		expect(pick([...routes(2), ...boulders(10)]).slice(0, 3)).toEqual(['r25', 'r24', 'V8']);
		expect(pick(boulders(3))).toEqual(['V8', 'V7', 'V6']);
	});

	it('skips ungraded sends and respects odd limits', () => {
		expect(pick([{ name: 'x', score: null, d: 'route' }, ...routes(1)])).toEqual(['r25']);
		expect(pick([...routes(5), ...boulders(5)], 5)).toEqual(['r25', 'r24', 'r23', 'V8', 'V7']);
	});
});
