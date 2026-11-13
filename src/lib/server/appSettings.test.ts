import { describe, expect, it } from 'vitest';
import { DEFAULT_DISPLAY_UNITS } from '#lib/units';
import {
	deleteAppSetting,
	getDateFormat,
	getDistanceUnit,
	getDisplayUnits,
	getHeightUnit,
	getPrecipitationUnit,
	getTemperatureUnit,
	getWindUnit,
	setAppSetting
} from './appSettings';

describe('appSettings units and date format (#469)', () => {
	it('defaults date format to auto', () => {
		deleteAppSetting('date_format');
		expect(getDateFormat()).toBe('auto');
	});

	it('persists and retrieves custom date formats', () => {
		setAppSetting('date_format', 'dd/mm/yyyy');
		expect(getDateFormat()).toBe('dd/mm/yyyy');

		setAppSetting('date_format', 'mm/dd/yyyy');
		expect(getDateFormat()).toBe('mm/dd/yyyy');

		setAppSetting('date_format', 'yyyy-mm-dd');
		expect(getDateFormat()).toBe('yyyy-mm-dd');

		setAppSetting('date_format', 'invalid_format');
		expect(getDateFormat()).toBe('auto');
	});

	it('defaults display units to metric standards', () => {
		deleteAppSetting('unit_height');
		deleteAppSetting('unit_distance');
		deleteAppSetting('unit_temperature');
		deleteAppSetting('unit_wind');
		deleteAppSetting('unit_precipitation');

		expect(getDisplayUnits()).toEqual(DEFAULT_DISPLAY_UNITS);
		expect(getHeightUnit()).toBe('m');
		expect(getDistanceUnit()).toBe('km');
		expect(getTemperatureUnit()).toBe('celsius');
		expect(getWindUnit()).toBe('kmh');
		expect(getPrecipitationUnit()).toBe('mm');
	});

	it('persists and retrieves granular unit overrides', () => {
		setAppSetting('unit_height', 'ft');
		setAppSetting('unit_distance', 'mi');
		setAppSetting('unit_temperature', 'fahrenheit');
		setAppSetting('unit_wind', 'mph');
		setAppSetting('unit_precipitation', 'in');

		expect(getDisplayUnits()).toEqual({
			height: 'ft',
			distance: 'mi',
			temperature: 'fahrenheit',
			wind: 'mph',
			precipitation: 'in'
		});
		expect(getHeightUnit()).toBe('ft');
		expect(getDistanceUnit()).toBe('mi');
		expect(getTemperatureUnit()).toBe('fahrenheit');
		expect(getWindUnit()).toBe('mph');
		expect(getPrecipitationUnit()).toBe('in');
	});
});
