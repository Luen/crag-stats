import { detectAndParseGrade } from '#lib/grades';

export type GoalGradeScale = 'route' | 'boulder';

export function parseGoalGradeScale(value: unknown): GoalGradeScale | null {
	return value === 'route' || value === 'boulder' ? value : null;
}

/** Numeric input uses the chosen canonical scale; named grades must fit that scale. */
export function parseScaledGoalGrade(raw: string, scale: GoalGradeScale): number | null {
	const text = raw.trim();
	if (!text) return null;
	if (/^-?\d+(\.\d+)?$/.test(text)) {
		const score = Number(text);
		return Number.isFinite(score) ? score : null;
	}
	const grade = detectAndParseGrade(text, { gearStyle: scale === 'boulder' ? 'Boulder' : 'Sport' });
	return grade.isBoulder === (scale === 'boulder') ? grade.score : null;
}
