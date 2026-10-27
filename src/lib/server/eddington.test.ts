import { describe, expect, it } from 'vitest';
import { buildEddington, eddingtonMetric, eddingtonNumber, type EddingtonRow } from './eddington';

describe('eddingtonNumber', () => {
	it('is the largest E with E values ≥ E', () => {
		expect(eddingtonNumber([])).toBe(0);
		expect(eddingtonNumber([1])).toBe(1);
		expect(eddingtonNumber([5, 5, 5])).toBe(3);
		expect(eddingtonNumber([10, 9, 3, 3, 1])).toBe(3);
		expect(eddingtonNumber([0, 0])).toBe(0);
	});

	it('scales thresholds by unit', () => {
		// 10 m units: days of 45, 30, 25, 5 m → 3 days ≥ 20 m but not 3 days ≥ 30 m.
		expect(eddingtonNumber([45, 30, 25, 5], 10)).toBe(2);
		expect(eddingtonNumber([45, 30, 30, 5], 10)).toBe(3);
	});
});

describe('eddingtonMetric', () => {
	it('reports how many more qualifying days reach E+1', () => {
		// E=3; need 4 days ≥ 4, have 2 (10, 9).
		expect(eddingtonMetric([10, 9, 3, 3, 1])).toEqual({ value: 3, next: 4, needed: 2 });
	});
});

describe('buildEddington', () => {
	const row = (p: Partial<EddingtonRow>): EddingtonRow => ({
		day: '2026-01-01',
		routeId: 1,
		isSend: true,
		heightM: 0,
		score: null,
		isBoulder: false,
		...p
	});

	it('counts sends and metres per day', () => {
		const rows = [
			row({ day: '2026-01-01', routeId: 1, heightM: 25 }),
			row({ day: '2026-01-01', routeId: 2, heightM: 25 }),
			row({ day: '2026-01-02', routeId: 3, heightM: 30 }),
			row({ day: '2026-01-02', routeId: 4, heightM: 15, isSend: false })
		];
		const e = buildEddington(rows);
		expect(e.activeDays).toBe(2);
		expect(e.sends.value).toBe(1); // 2 sends then 1 send
		expect(e.vertical.value).toBe(2); // 50 m and 45 m ≥ 20 m
	});

	it('uses one best send per route for the grade index and splits boulders', () => {
		const rows = [
			// Same route repeated must not count three times.
			row({ routeId: 1, score: 20 }),
			row({ routeId: 1, score: 20 }),
			row({ routeId: 1, score: 20 }),
			row({ routeId: 2, score: 2 }),
			row({ routeId: 3, score: 3 }),
			row({ routeId: 4, score: 5.5, isBoulder: true }),
			row({ routeId: 5, score: 2, isBoulder: true }),
			row({ routeId: 6, score: 1, isBoulder: true }),
			row({ routeId: 7, score: 25, isSend: false })
		];
		const e = buildEddington(rows);
		expect(e.routeGrade.value).toBe(2); // 20, 3, 2 → 2 routes ≥ 2, not 3 ≥ 3
		expect(e.boulderGrade.value).toBe(2); // V5, V2, V1
	});
});
