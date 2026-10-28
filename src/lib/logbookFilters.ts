/** Shared logbook facet options (URL multi-select + form checkboxes). */
import { convertFromEwbank, type GradeSystem } from '#lib/grades';

export const LOGBOOK_TICKS = [
	'Onsight',
	'Flash',
	'Red point',
	'Pink point',
	'Tick',
	'Send',
	'Clean',
	'Attempt',
	'Hang dog',
	'Working',
	'Retreat',
	'Repeat',
	'Top rope',
	'Lead',
	'Free solo',
	'Solo',
	'Roped solo',
	'Lead solo',
	'Aid solo',
	'All free with rest',
	'Dab',
	'Hit',
	'Target',
	'Mark'
] as const;

export const LOGBOOK_STYLES = [
	'Sport',
	'Trad',
	'Boulder',
	'Top rope',
	'Deep water solo',
	'Aid',
	'Alpine',
	'Solo'
] as const;

export const LOGBOOK_QUALITIES = [
	'Mega Classic',
	'Classic',
	'Very Good',
	'Good',
	'Average',
	"Don't Bother",
	'Crap'
] as const;

/** Ewbank-canonical scores 1–39 with labels in the preferred display system. */
export function routeGradeOptions(system: GradeSystem): { score: number; label: string }[] {
	const out: { score: number; label: string }[] = [];
	for (let score = 1; score <= 39; score++) {
		const label = convertFromEwbank(score, system);
		out.push({ score, label: system === 'ewbank' ? label : `${label} (${score})` });
	}
	return out;
}

/** Keep custom/legacy URL values visible when changing another facet. */
export function includeSelectedOptions(
	options: readonly string[],
	selected: readonly string[]
): string[] {
	return [...new Set([...options, ...selected])];
}
