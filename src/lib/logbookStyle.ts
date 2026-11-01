import { soloKind } from '#lib/soloKind';
export { soloKind } from '#lib/soloKind';
import { climbStyleLabel } from './climbStyle';
/**
 * Client-safe logbook style labels (discipline + solo variants).
 * Mirrors `#lib/server/solo` soloKind rules and dashboard displayStyle buckets.
 */

export type LogbookStyleRow = {
	tickType: string | null | undefined;
	ascentGearStyle: string | null | undefined;
	gearStyle: string | null | undefined;
};

export type SoloKind = 'toprope' | 'lead' | 'free' | 'dws' | 'aid';

const SOLO_LABELS: Record<SoloKind, string> = {
	toprope: 'Top-rope solo',
	lead: 'Lead solo',
	free: 'Free solo',
	dws: 'Deep water solo',
	aid: 'Aid solo'
};

/** Boulder / Sport / Trad / Top rope / Other — matches dashboardExtras.displayStyle. */
export function displayStyle(gearStyle: string | null | undefined): string {
	const s = (gearStyle || '').trim().toLowerCase();
	if (!s) return 'Other';
	if (s.includes('boulder')) return 'Boulder';
	if (s.includes('trad')) return 'Trad';
	if (s.includes('sport')) return 'Sport';
	if (s.includes('top')) return 'Top rope';
	return 'Other';
}

/** StyleBadge labels to show beside the tick icon in the logbook. */
export function logbookStyleLabels(row: LogbookStyleRow): string[] {
	const labels: string[] = [];
	const discipline = climbStyleLabel(row.gearStyle);
	if (discipline !== 'Other') labels.push(discipline);

	const kind = soloKind(row);
	const ascentStyle = climbStyleLabel(row.ascentGearStyle);
	if (!kind && ascentStyle !== 'Other' && !labels.includes(ascentStyle)) labels.push(ascentStyle);
	if (kind) {
		const solo = SOLO_LABELS[kind];
		if (!labels.includes(solo)) labels.push(solo);
	}

	if (labels.length === 0) labels.push('Other');
	return labels;
}
