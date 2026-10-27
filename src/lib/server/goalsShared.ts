import { detectAndParseGrade } from '#lib/grades';
import type { VenueScope } from './venue';

export type GoalKind = 'grade' | 'height_year' | 'days_month' | 'custom';

export function kindLabel(kind: string): string {
	switch (kind) {
		case 'height_year':
			return 'Height / year';
		case 'days_month':
			return 'Days this month';
		case 'grade':
			return 'Grade this year';
		default:
			return 'Custom';
	}
}

export function defaultVenueForKind(kind: GoalKind | string): VenueScope {
	return kind === 'grade' ? 'outdoor' : 'any';
}

/** Parse a grade field: numeric score or display grade (e.g. 25, 7a, V5). */
export function parseGoalGradeScore(
	raw: string | number | null | undefined,
	preferBoulder = false
): number | null {
	if (raw == null || raw === '') return null;
	if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
	const s = String(raw).trim();
	if (!s) return null;
	if (/^-?\d+(\.\d+)?$/.test(s)) {
		const n = Number(s);
		return Number.isFinite(n) ? n : null;
	}
	const parsed = detectAndParseGrade(s, preferBoulder ? { gearStyle: 'boulder' } : undefined);
	return parsed.score;
}

export function progressPct(current: number, target: number): number {
	if (!Number.isFinite(target) || target <= 0) return 0;
	if (!Number.isFinite(current) || current <= 0) return 0;
	return Math.min(100, Math.round((current / target) * 1000) / 10);
}
