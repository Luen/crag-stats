import { describe, expect, it } from 'vitest';
import { buildVisitClimate, VISIT_CLIMATE_MIN_DAYS } from './visitClimate';
import type { WeatherSnapshot } from './weatherKeys';

const day = (over: Partial<WeatherSnapshot> = {}): WeatherSnapshot => ({
	tempMaxC: 20,
	tempMinC: 10,
	precipMm: 0,
	weatherCode: 1,
	...over
});

describe('buildVisitClimate (#278)', () => {
	it('needs at least five cached visit days', () => {
		expect(VISIT_CLIMATE_MIN_DAYS).toBe(5);
		expect(buildVisitClimate([])).toBeNull();
		expect(buildVisitClimate(Array.from({ length: 4 }, () => day()))).toBeNull();
		expect(buildVisitClimate(Array.from({ length: 5 }, () => day()))?.days).toBe(5);
	});

	it('averages highs/lows and reports whole-percent shares', () => {
		const climate = buildVisitClimate([
			day({ tempMaxC: 10, tempMinC: -2 }),
			day({ tempMaxC: 20, tempMinC: 8, precipMm: 4, weatherCode: 61 }),
			day({ tempMaxC: 30, tempMinC: 18 }),
			day({ tempMaxC: 36, tempMinC: 24 }),
			day({ tempMaxC: 0, tempMinC: -6, precipMm: 3, weatherCode: 73 })
		])!;
		expect(climate.days).toBe(5);
		expect(climate.avgHighC).toBe(19);
		expect(climate.avgLowC).toBe(8);
		expect(climate.rainPct).toBe(20);
		expect(climate.snowPct).toBe(20);
		expect(climate.freezePct).toBe(40);
		expect(climate.heatPct).toBe(20);
	});

	it('tolerates missing temperatures', () => {
		const climate = buildVisitClimate(
			Array.from({ length: 5 }, () => day({ tempMaxC: null, tempMinC: null }))
		)!;
		expect(climate.avgHighC).toBeNull();
		expect(climate.avgLowC).toBeNull();
	});
});
