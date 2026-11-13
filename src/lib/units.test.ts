import { describe, expect, it } from 'vitest';
import {
	applyDisplayUnitOverrides,
	convertDistance,
	convertHeight,
	convertPrecipitation,
	convertTemperature,
	convertWind,
	DEFAULT_DISPLAY_UNITS,
	formatDistance,
	formatHeight,
	formatPrecipitation,
	formatTemperature,
	formatWind,
	parseDistanceUnit,
	parseHeightUnit,
	parsePrecipitationUnit,
	parseTemperatureUnit,
	parseWindUnit,
	resolveDisplayUnits,
	UNIT_PRESETS
} from './units';

describe('units parsing', () => {
	it('parses valid units and rejects invalid values', () => {
		expect(parseHeightUnit('m')).toBe('m');
		expect(parseHeightUnit('ft')).toBe('ft');
		expect(parseHeightUnit('km')).toBeNull();

		expect(parseDistanceUnit('km')).toBe('km');
		expect(parseDistanceUnit('mi')).toBe('mi');
		expect(parseDistanceUnit('m')).toBeNull();

		expect(parseTemperatureUnit('celsius')).toBe('celsius');
		expect(parseTemperatureUnit('fahrenheit')).toBe('fahrenheit');
		expect(parseTemperatureUnit('kelvin')).toBeNull();

		expect(parseWindUnit('kmh')).toBe('kmh');
		expect(parseWindUnit('mph')).toBe('mph');
		expect(parseWindUnit('knots')).toBeNull();

		expect(parsePrecipitationUnit('mm')).toBe('mm');
		expect(parsePrecipitationUnit('in')).toBe('in');
		expect(parsePrecipitationUnit('cm')).toBeNull();
	});

	it('resolves display units falling back to defaults', () => {
		expect(resolveDisplayUnits({})).toEqual(DEFAULT_DISPLAY_UNITS);
		expect(
			resolveDisplayUnits({
				height: 'ft',
				distance: 'mi',
				temperature: 'fahrenheit',
				wind: 'mph',
				precipitation: 'in'
			})
		).toEqual({
			height: 'ft',
			distance: 'mi',
			temperature: 'fahrenheit',
			wind: 'mph',
			precipitation: 'in'
		});
	});

	it('applies URL preset and parameter overrides', () => {
		const base = DEFAULT_DISPLAY_UNITS;
		const imperial = applyDisplayUnitOverrides(base, new URLSearchParams('units=imperial'));
		expect(imperial).toEqual({
			height: 'ft',
			distance: 'mi',
			temperature: 'fahrenheit',
			wind: 'mph',
			precipitation: 'in'
		});

		const uk = applyDisplayUnitOverrides(base, new URLSearchParams('units=uk'));
		expect(uk).toEqual({
			height: 'm',
			distance: 'mi',
			temperature: 'celsius',
			wind: 'mph',
			precipitation: 'mm'
		});

		const custom = applyDisplayUnitOverrides(
			base,
			new URLSearchParams('unitHeight=ft&unitTemp=fahrenheit')
		);
		expect(custom.height).toBe('ft');
		expect(custom.temperature).toBe('fahrenheit');
		expect(custom.distance).toBe('km');
	});
});

describe('height conversions and formatting', () => {
	it('converts meters to feet accurately', () => {
		expect(Math.round(convertHeight(10, 'ft'))).toBe(33);
		expect(convertHeight(10, 'm')).toBe(10);
	});

	it('formats height in meters and feet', () => {
		expect(formatHeight(25, 'm')).toBe('25 m');
		expect(formatHeight(25, 'ft')).toBe('82 ft');
		expect(formatHeight(null, 'ft')).toBe('');
		expect(formatHeight(undefined, 'm')).toBe('');
	});
});

describe('distance conversions and formatting', () => {
	it('converts km to miles accurately', () => {
		expect(Math.round(convertDistance(10, 'mi') * 10) / 10).toBe(6.2);
		expect(convertDistance(10, 'km')).toBe(10);
	});

	it('formats distance in km and miles', () => {
		expect(formatDistance(12.4, 'km')).toBe('12.4 km');
		expect(formatDistance(12.4, 'mi')).toBe('7.7 mi');
		expect(formatDistance(null, 'mi')).toBe('');
	});
});

describe('temperature conversions and formatting', () => {
	it('converts celsius to fahrenheit accurately', () => {
		expect(Math.round(convertTemperature(0, 'fahrenheit'))).toBe(32);
		expect(Math.round(convertTemperature(35, 'fahrenheit'))).toBe(95);
		expect(Math.round(convertTemperature(20, 'fahrenheit'))).toBe(68);
		expect(convertTemperature(20, 'celsius')).toBe(20);
	});

	it('formats temperature in celsius and fahrenheit', () => {
		expect(formatTemperature(20, 'celsius')).toBe('20°C');
		expect(formatTemperature(20, 'fahrenheit')).toBe('68°F');
		expect(formatTemperature(0, 'fahrenheit')).toBe('32°F');
		expect(formatTemperature(35, 'fahrenheit')).toBe('95°F');
		expect(formatTemperature(null)).toBe('');
	});
});

describe('wind conversions and formatting', () => {
	it('converts km/h to mph accurately', () => {
		expect(Math.round(convertWind(50, 'mph'))).toBe(31);
		expect(Math.round(convertWind(25, 'mph'))).toBe(16);
	});

	it('formats wind in km/h and mph', () => {
		expect(formatWind(50, 'kmh')).toBe('50 km/h');
		expect(formatWind(50, 'mph')).toBe('31 mph');
		expect(formatWind(null)).toBe('');
	});
});

describe('precipitation conversions and formatting', () => {
	it('converts mm to inches accurately', () => {
		expect(Number(convertPrecipitation(25.4, 'in').toFixed(2))).toBe(1);
	});

	it('formats precipitation in mm and inches', () => {
		expect(formatPrecipitation(15, 'mm')).toBe('15 mm');
		expect(formatPrecipitation(25.4, 'in')).toBe('1.00 in');
		expect(formatPrecipitation(null)).toBe('');
	});
});

describe('unit presets', () => {
	it('defines metric, imperial, and uk presets', () => {
		const ids = UNIT_PRESETS.map((p) => p.id);
		expect(ids).toEqual(['metric', 'imperial', 'uk']);
	});
});
