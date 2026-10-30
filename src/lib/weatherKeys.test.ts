import { describe, expect, it } from 'vitest';
import {
	isFairWeather,
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	isStickyHumidity,
	isStormPrecip,
	isWeatherFilterKey,
	isWindyWeather,
	lookupAscentWeather,
	matchesWeatherFilter,
	roundCoord,
	weatherAscentDay,
	weatherChips,
	weatherConditions,
	weatherDayKey
} from './weatherKeys';

describe('weatherKeys', () => {
	it('rounds coords to 1 decimal', () => {
		expect(roundCoord(-33.867)).toBe(-33.9);
		expect(roundCoord(151.2093)).toBe(151.2);
		expect(roundCoord(0.04)).toBe(0);
		expect(roundCoord(0.05)).toBe(0.1);
	});

	it('builds stable cache keys', () => {
		expect(weatherDayKey(-33.9, 151.2, '2024-01-15')).toBe('-33.9|151.2|2024-01-15');
	});
});

describe('weather conditions', () => {
	it('detects heat at ≥35°C max', () => {
		expect(isHeatWeather({ tempMaxC: 35, tempMinC: 20, precipMm: 0, weatherCode: 0 })).toBe(true);
		expect(isHeatWeather({ tempMaxC: 34.9, tempMinC: 20, precipMm: 0, weatherCode: 0 })).toBe(
			false
		);
	});

	it('detects freeze at ≤0°C min', () => {
		expect(isFreezeWeather({ tempMaxC: 5, tempMinC: 0, precipMm: 0, weatherCode: 0 })).toBe(true);
		expect(isFreezeWeather({ tempMaxC: 5, tempMinC: 0.1, precipMm: 0, weatherCode: 0 })).toBe(
			false
		);
	});

	it('detects snow from WMO codes or precip near freezing', () => {
		expect(isSnowWeather({ tempMaxC: 2, tempMinC: -1, precipMm: 0, weatherCode: 73 })).toBe(true);
		expect(isSnowWeather({ tempMaxC: 0.5, tempMinC: -2, precipMm: 1.2, weatherCode: 61 })).toBe(
			true
		);
		expect(isSnowWeather({ tempMaxC: 5, tempMinC: 1, precipMm: 2, weatherCode: 61 })).toBe(false);
	});

	it('classifies rain only when not snow', () => {
		expect(isRainWeather({ tempMaxC: 12, tempMinC: 8, precipMm: 1, weatherCode: 61 })).toBe(true);
		expect(isRainWeather({ tempMaxC: 0, tempMinC: -3, precipMm: 2, weatherCode: 71 })).toBe(false);
		expect(isRainWeather({ tempMaxC: 12, tempMinC: 8, precipMm: 0.5, weatherCode: 61 })).toBe(
			false
		);
	});

	it('detects wind at ≥50 km/h max', () => {
		expect(
			isWindyWeather({
				tempMaxC: 18,
				tempMinC: 10,
				precipMm: 0,
				weatherCode: 0,
				windMaxKmh: 50
			})
		).toBe(true);
		expect(
			isWindyWeather({
				tempMaxC: 18,
				tempMinC: 10,
				precipMm: 0,
				weatherCode: 0,
				windMaxKmh: 49.9
			})
		).toBe(false);
		expect(
			isWindyWeather({ tempMaxC: 18, tempMinC: 10, precipMm: 0, weatherCode: 0, windMaxKmh: null })
		).toBe(false);
	});

	it('lists overlapping heat + rain + wind', () => {
		expect(
			weatherConditions({
				tempMaxC: 36,
				tempMinC: 24,
				precipMm: 2,
				weatherCode: 63,
				windMaxKmh: 60
			})
		).toEqual(['heat', 'rain', 'wind']);
	});

	it('detects fair / bluebird days', () => {
		expect(isFairWeather({ tempMaxC: 20, tempMinC: 12, precipMm: 0, weatherCode: 1 })).toBe(true);
		expect(isFairWeather({ tempMaxC: 14.9, tempMinC: 10, precipMm: 0, weatherCode: 0 })).toBe(
			false
		);
		expect(isFairWeather({ tempMaxC: 20, tempMinC: 12, precipMm: 0.2, weatherCode: 0 })).toBe(
			false
		);
		expect(isFairWeather({ tempMaxC: 20, tempMinC: 12, precipMm: 0, weatherCode: 95 })).toBe(false);
	});

	it('detects sticky humidity and storm precip', () => {
		expect(
			isStickyHumidity({
				tempMaxC: 28,
				tempMinC: 22,
				precipMm: 0,
				weatherCode: 0,
				humidityMean: 85
			})
		).toBe(true);
		expect(
			isStickyHumidity({
				tempMaxC: 28,
				tempMinC: 22,
				precipMm: 0,
				weatherCode: 0,
				humidityMean: 84
			})
		).toBe(false);
		expect(isStormPrecip({ tempMaxC: 18, tempMinC: 14, precipMm: 10, weatherCode: 63 })).toBe(true);
		expect(isStormPrecip({ tempMaxC: 0, tempMinC: -2, precipMm: 12, weatherCode: 73 })).toBe(false);
	});
});

describe('ascent weather lookup', () => {
	const w = { tempMaxC: 36, tempMinC: 22, precipMm: 0, weatherCode: 0 };
	const map = new Map([[weatherDayKey(-33.9, 151.2, '2024-01-15'), w]]);
	const row = { ascentDate: '2024-01-15T00:00:00Z', lat: -33.867, lon: 151.2093 };

	it('validates calendar days', () => {
		expect(weatherAscentDay('2024-01-15T10:00:00Z')).toBe('2024-01-15');
		expect(weatherAscentDay('2018-00-00')).toBeNull();
		expect(weatherAscentDay('2018-05-00')).toBeNull();
		expect(weatherAscentDay(null)).toBeNull();
	});

	it('matches via rounded coords and the day', () => {
		expect(lookupAscentWeather(map, row)).toBe(w);
		expect(lookupAscentWeather(map, { ...row, ascentDate: '2024-01-16' })).toBeNull();
		expect(lookupAscentWeather(map, { ...row, lat: null })).toBeNull();
		expect(lookupAscentWeather(undefined, row)).toBeNull();
		expect(lookupAscentWeather(new Map(), row)).toBeNull();
	});

	it('never matches indoor routes', () => {
		expect(lookupAscentWeather(map, { ...row, outdoor: false })).toBeNull();
		expect(lookupAscentWeather(map, { ...row, outdoor: true })).toBe(w);
	});

	it('maps filter keys onto the shared predicates', () => {
		expect(isWeatherFilterKey('heat')).toBe(true);
		expect(isWeatherFilterKey('wind')).toBe(false);
		expect(isWeatherFilterKey(null)).toBe(false);
		expect(matchesWeatherFilter(w, 'heat')).toBe(true);
		expect(matchesWeatherFilter(w, 'fair')).toBe(false);
		expect(
			matchesWeatherFilter({ tempMaxC: 20, tempMinC: 10, precipMm: 0, weatherCode: 0 }, 'fair')
		).toBe(true);
	});
});

describe('weatherChips', () => {
	it('returns plain-text chips for notable days and nothing for ordinary ones', () => {
		expect(weatherChips({ tempMaxC: 18, tempMinC: 8, precipMm: 3, weatherCode: 61 })).toEqual([
			{ key: 'rain', name: 'Rain', value: 3, unit: 'mm' }
		]);
		expect(weatherChips({ tempMaxC: 30, tempMinC: 15, precipMm: 0, weatherCode: 1 })).toEqual([]);
		const keys = weatherChips({
			tempMaxC: 37,
			tempMinC: 25,
			precipMm: 0,
			weatherCode: 0,
			windMaxKmh: 60
		}).map((c) => c.key);
		expect(keys).toEqual(['heat', 'wind']);
	});

	it('shows snow instead of rain and keeps freezing alongside', () => {
		const keys = weatherChips({ tempMaxC: 0, tempMinC: -5, precipMm: 4, weatherCode: 73 }).map(
			(c) => c.key
		);
		expect(keys).toEqual(['freeze', 'snow']);
	});
});
