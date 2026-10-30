import { describe, expect, it } from 'vitest';
import {
	isFairWeather,
	isFreezeWeather,
	isHeatWeather,
	isRainWeather,
	isSnowWeather,
	isStickyHumidity,
	isStormPrecip,
	isWindyWeather,
	roundCoord,
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
