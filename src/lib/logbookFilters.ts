/** Shared logbook facet option lists (filter `<select>`s / future multi-select). */

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

/** Keep custom/legacy URL values visible when changing another facet. */
export function includeSelectedOptions(
	options: readonly string[],
	selected: readonly string[]
): string[] {
	return [...new Set([...options, ...selected])];
}
