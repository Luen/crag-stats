/**
 * Granular display units of measurement (#469).
 *
 * Local SQLite stores canonical values (metres, Celsius, km/h, mm);
 * unit conversions happen purely in the presentation layer.
 */

import { formatMessage } from '#lib/i18n/format';
import { DEFAULT_LOCALE } from '#lib/i18n/types';

export type HeightUnit = 'm' | 'ft';
export type DistanceUnit = 'km' | 'mi';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type WindUnit = 'kmh' | 'mph';
export type PrecipitationUnit = 'mm' | 'in';

export type DisplayUnits = {
	height: HeightUnit;
	distance: DistanceUnit;
	temperature: TemperatureUnit;
	wind: WindUnit;
	precipitation: PrecipitationUnit;
};

export const DEFAULT_DISPLAY_UNITS: DisplayUnits = {
	height: 'm',
	distance: 'km',
	temperature: 'celsius',
	wind: 'kmh',
	precipitation: 'mm'
};

export type UnitPresetId = 'metric' | 'imperial' | 'uk';

export type UnitPreset = {
	id: UnitPresetId;
	label: string;
	labelKey: string;
	description: string;
	descriptionKey: string;
	units: DisplayUnits;
};

const UNIT_PRESET_SPECS: readonly Omit<UnitPreset, 'label' | 'description'>[] = [
	{
		id: 'metric',
		labelKey: 'pages.settings.presetMetricLabel',
		descriptionKey: 'pages.settings.presetMetricDesc',
		units: {
			height: 'm',
			distance: 'km',
			temperature: 'celsius',
			wind: 'kmh',
			precipitation: 'mm'
		}
	},
	{
		id: 'imperial',
		labelKey: 'pages.settings.presetImperialLabel',
		descriptionKey: 'pages.settings.presetImperialDesc',
		units: {
			height: 'ft',
			distance: 'mi',
			temperature: 'fahrenheit',
			wind: 'mph',
			precipitation: 'in'
		}
	},
	{
		id: 'uk',
		labelKey: 'pages.settings.presetUkLabel',
		descriptionKey: 'pages.settings.presetUkDesc',
		units: {
			height: 'm',
			distance: 'mi',
			temperature: 'celsius',
			wind: 'mph',
			precipitation: 'mm'
		}
	}
];

export const UNIT_PRESETS: readonly UnitPreset[] = UNIT_PRESET_SPECS.map((p) => ({
	...p,
	label: formatMessage(DEFAULT_LOCALE, p.labelKey),
	description: formatMessage(DEFAULT_LOCALE, p.descriptionKey)
}));

function withLabels<T extends { labelKey: string }>(
	items: readonly T[]
): readonly (T & { label: string })[] {
	return items.map((item) => ({
		...item,
		label: formatMessage(DEFAULT_LOCALE, item.labelKey)
	}));
}

export const HEIGHT_UNIT_OPTIONS = withLabels([
	{ id: 'm' as const, labelKey: 'pages.settings.unitMetres' },
	{ id: 'ft' as const, labelKey: 'pages.settings.unitFeet' }
] as const);

export const DISTANCE_UNIT_OPTIONS = withLabels([
	{ id: 'km' as const, labelKey: 'pages.settings.unitKilometres' },
	{ id: 'mi' as const, labelKey: 'pages.settings.unitMiles' }
] as const);

export const TEMPERATURE_UNIT_OPTIONS = withLabels([
	{ id: 'celsius' as const, labelKey: 'pages.settings.unitCelsius' },
	{ id: 'fahrenheit' as const, labelKey: 'pages.settings.unitFahrenheit' }
] as const);

export const WIND_UNIT_OPTIONS = withLabels([
	{ id: 'kmh' as const, labelKey: 'pages.settings.unitKmh' },
	{ id: 'mph' as const, labelKey: 'pages.settings.unitMph' }
] as const);

export const PRECIPITATION_UNIT_OPTIONS = withLabels([
	{ id: 'mm' as const, labelKey: 'pages.settings.unitMm' },
	{ id: 'in' as const, labelKey: 'pages.settings.unitInches' }
] as const);

export const METERS_TO_FEET = 3.280839895;
export const FEET_TO_METERS = 0.3048;
export const KM_TO_MILES = 0.621371192;
export const MM_TO_INCHES = 0.0393700787;

export function parseHeightUnit(raw: unknown): HeightUnit | null {
	if (raw === 'm' || raw === 'ft') return raw;
	return null;
}

export function parseDistanceUnit(raw: unknown): DistanceUnit | null {
	if (raw === 'km' || raw === 'mi') return raw;
	return null;
}

export function parseTemperatureUnit(raw: unknown): TemperatureUnit | null {
	if (raw === 'celsius' || raw === 'fahrenheit') return raw;
	return null;
}

export function parseWindUnit(raw: unknown): WindUnit | null {
	if (raw === 'kmh' || raw === 'mph') return raw;
	return null;
}

export function parsePrecipitationUnit(raw: unknown): PrecipitationUnit | null {
	if (raw === 'mm' || raw === 'in') return raw;
	return null;
}

export function resolveDisplayUnits(stored: {
	height?: string | null;
	distance?: string | null;
	temperature?: string | null;
	wind?: string | null;
	precipitation?: string | null;
}): DisplayUnits {
	return {
		height: parseHeightUnit(stored.height) ?? DEFAULT_DISPLAY_UNITS.height,
		distance: parseDistanceUnit(stored.distance) ?? DEFAULT_DISPLAY_UNITS.distance,
		temperature: parseTemperatureUnit(stored.temperature) ?? DEFAULT_DISPLAY_UNITS.temperature,
		wind: parseWindUnit(stored.wind) ?? DEFAULT_DISPLAY_UNITS.wind,
		precipitation:
			parsePrecipitationUnit(stored.precipitation) ?? DEFAULT_DISPLAY_UNITS.precipitation
	};
}

export function applyDisplayUnitOverrides(
	units: DisplayUnits,
	params: URLSearchParams
): DisplayUnits {
	const preset = params.get('units') || params.get('unitPreset');
	let base = { ...units };
	if (preset === 'metric' || preset === 'imperial' || preset === 'uk') {
		const found = UNIT_PRESETS.find((p) => p.id === preset);
		if (found) base = { ...found.units };
	}
	const height = parseHeightUnit(params.get('unitHeight'));
	const distance = parseDistanceUnit(params.get('unitDistance'));
	const temperature = parseTemperatureUnit(params.get('unitTemp') || params.get('unitTemperature'));
	const wind = parseWindUnit(params.get('unitWind'));
	const precipitation = parsePrecipitationUnit(
		params.get('unitPrecip') || params.get('unitPrecipitation')
	);
	return {
		height: height ?? base.height,
		distance: distance ?? base.distance,
		temperature: temperature ?? base.temperature,
		wind: wind ?? base.wind,
		precipitation: precipitation ?? base.precipitation
	};
}

// ---------------- Height helpers ----------------

export function convertHeight(meters: number, unit: HeightUnit): number {
	return unit === 'ft' ? meters * METERS_TO_FEET : meters;
}

/** Inverse of {@link convertHeight} for owner-entered feet (#483). */
export function feetToMeters(feet: number): number {
	return feet * FEET_TO_METERS;
}

export function formatHeight(meters: number | null | undefined, unit: HeightUnit = 'm'): string {
	if (meters == null || !Number.isFinite(meters)) return '';
	if (unit === 'ft') {
		return `${Math.round(meters * METERS_TO_FEET)} ft`;
	}
	return `${Math.round(meters)} m`;
}

export function heightUnitLabel(unit: HeightUnit): string {
	return unit === 'ft' ? 'ft' : 'm';
}

// ---------------- Distance helpers ----------------

export function convertDistance(km: number, unit: DistanceUnit): number {
	return unit === 'mi' ? km * KM_TO_MILES : km;
}

export function formatDistance(km: number | null | undefined, unit: DistanceUnit = 'km'): string {
	if (km == null || !Number.isFinite(km)) return '';
	if (unit === 'mi') {
		const val = Math.round(km * KM_TO_MILES * 10) / 10;
		return `${val} mi`;
	}
	const val = Math.round(km * 10) / 10;
	return `${val} km`;
}

export function distanceUnitLabel(unit: DistanceUnit): string {
	return unit === 'mi' ? 'mi' : 'km';
}

// ---------------- Temperature helpers ----------------

export function celsiusToFahrenheit(c: number): number {
	return (c * 9) / 5 + 32;
}

export function fahrenheitToCelsius(f: number): number {
	return ((f - 32) * 5) / 9;
}

export function convertTemperature(c: number, unit: TemperatureUnit): number {
	return unit === 'fahrenheit' ? celsiusToFahrenheit(c) : c;
}

export function formatTemperature(
	c: number | null | undefined,
	unit: TemperatureUnit = 'celsius'
): string {
	if (c == null || !Number.isFinite(c)) return '';
	if (unit === 'fahrenheit') {
		return `${Math.round(celsiusToFahrenheit(c))}°F`;
	}
	return `${Math.round(c)}°C`;
}

export function temperatureUnitLabel(unit: TemperatureUnit): string {
	return unit === 'fahrenheit' ? '°F' : '°C';
}

/**
 * Detail formatting for cached readings (logbook Weather column): convert to the display
 * unit but keep the stored precision instead of rounding to whole numbers.
 */
export function formatTemperatureDetail(
	c: number | null | undefined,
	unit: TemperatureUnit = 'celsius'
): string {
	if (c == null || !Number.isFinite(c)) return '';
	if (unit === 'fahrenheit') {
		return `${Math.round(celsiusToFahrenheit(c) * 10) / 10}°F`;
	}
	return `${Math.round(c * 10) / 10}°C`;
}

// ---------------- Wind helpers ----------------

export function convertWind(kmh: number, unit: WindUnit): number {
	return unit === 'mph' ? kmh * KM_TO_MILES : kmh;
}

export function formatWind(kmh: number | null | undefined, unit: WindUnit = 'kmh'): string {
	if (kmh == null || !Number.isFinite(kmh)) return '';
	if (unit === 'mph') {
		return `${Math.round(kmh * KM_TO_MILES)} mph`;
	}
	return `${Math.round(kmh)} km/h`;
}

export function windUnitLabel(unit: WindUnit): string {
	return unit === 'mph' ? 'mph' : 'km/h';
}

// ---------------- Precipitation helpers ----------------

export function convertPrecipitation(mm: number, unit: PrecipitationUnit): number {
	return unit === 'in' ? mm * MM_TO_INCHES : mm;
}

export function formatPrecipitation(
	mm: number | null | undefined,
	unit: PrecipitationUnit = 'mm'
): string {
	if (mm == null || !Number.isFinite(mm)) return '';
	if (unit === 'in') {
		const val = Math.round(mm * MM_TO_INCHES * 100) / 100;
		return `${val.toFixed(2)} in`;
	}
	const val = Math.round(mm * 10) / 10;
	return `${val} mm`;
}

export function precipitationUnitLabel(unit: PrecipitationUnit): string {
	return unit === 'in' ? 'in' : 'mm';
}
