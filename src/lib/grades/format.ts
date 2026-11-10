import {
	convertFromEwbank,
	convertFromVScale,
	formatVScaleLabel,
	type GradeSystem
} from './conversions';

/**
 * Display label for a stored score in the owner's preferred grade system. Boulder scores
 * are V-scale (or Font when preferred); route scores are Ewbank-equivalent.
 */
export function formatGradeLabel(
	score: number,
	isBoulder: boolean,
	system: GradeSystem,
	raw?: string | null
): string {
	if (isBoulder) {
		if (system === 'font') return convertFromVScale(score, 'font');
		return formatVScaleLabel(score, raw);
	}
	const routeSystem: GradeSystem = system === 'v_scale' || system === 'font' ? 'ewbank' : system;
	return convertFromEwbank(score, routeSystem);
}
