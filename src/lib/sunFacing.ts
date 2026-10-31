import { parseTagsJson } from './routeTags';
import { weatherAscentDay, type WeatherLocation } from './weatherKeys';
/** Product coverage limits: buffer outside the tropics, exclude high-latitude solar complexity. */
export const SUN_FACE_MIN_LAT = 25;
export const SUN_FACE_MAX_LAT = 60;
const ASPECTS: Record<string, string> = {
	n: 'N',
	north: 'N',
	ne: 'NE',
	northeast: 'NE',
	e: 'E',
	east: 'E',
	se: 'SE',
	southeast: 'SE',
	s: 'S',
	south: 'S',
	sw: 'SW',
	southwest: 'SW',
	w: 'W',
	west: 'W',
	nw: 'NW',
	northwest: 'NW'
};
/** Seasonal/aspect heuristic, not a claim of measured sunshine or rock temperature. */
export function isSunFacingSummer(row: {
	ascentDate: string | null;
	lat?: number | null;
	tagsJson?: string | null;
	weatherLocation?: WeatherLocation | null;
}): boolean {
	const day = weatherAscentDay(row.ascentDate);
	if (!day || day.startsWith('0000-') || row.weatherLocation === null) return false;
	if (
		row.weatherLocation?.source === 'place' ||
		row.weatherLocation?.source === 'cached' ||
		row.weatherLocation?.source === 'polygon'
	)
		return false;
	const lat = row.weatherLocation?.lat ?? row.lat;
	if (
		lat == null ||
		!Number.isFinite(lat) ||
		Math.abs(lat) < SUN_FACE_MIN_LAT ||
		Math.abs(lat) >= SUN_FACE_MAX_LAT
	)
		return false;
	const month = Number(day.slice(5, 7));
	if (lat > 0 ? month < 6 || month > 8 : !(month === 12 || month === 1 || month === 2))
		return false;
	const normalize = (name: string) =>
		name
			.trim()
			.toLowerCase()
			.replace(/[\s_-]+/g, '');
	const sunTags = new Set(['alldaysun', 'morningsun', 'noonsun', 'afternoonsun', 'alwaysshady']);
	const exposure = parseTagsJson(row.tagsJson).filter(
		(t) =>
			t.category.trim().toLowerCase() === 'aspect' ||
			(t.category.trim().toLowerCase() === 'weather' && sunTags.has(normalize(t.name)))
	);
	// Route-specific exposure always wins. Only when absent may the verified immediate parent fill in.
	const direct = exposure.filter((t) => t.source === 'route');
	const selected = direct.length
		? direct
		: exposure.some((t) => t.source == null)
			? []
			: exposure.filter((t) => t.source === 'parent');
	const weather = selected.filter((t) => t.category.trim().toLowerCase() === 'weather');
	// Shade contradicts both routes to this sunny-face badge at the selected source level.
	if (weather.some((t) => normalize(t.name) === 'alwaysshady')) return false;
	if (weather.some((t) => normalize(t.name) === 'alldaysun')) return true;
	const tags = selected.filter((t) => t.category.trim().toLowerCase() === 'aspect');
	if (!tags.length) return false;
	const wanted = lat < 0 ? new Set(['N', 'NE', 'NW']) : new Set(['S', 'SE', 'SW']);
	return tags.every((t) =>
		wanted.has(
			ASPECTS[
				t.name
					.trim()
					.toLowerCase()
					.replace(/[\s_-]+/g, '')
			] ?? ''
		)
	);
}
