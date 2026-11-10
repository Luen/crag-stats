import { expect, it } from 'vitest';
import { parseGoalGradeScale, parseScaledGoalGrade } from './goalGrades';

it('parses typed targets in their explicit scale without comparing unrelated numbers', () => {
	expect(parseScaledGoalGrade('V5', 'boulder')).toBe(5);
	expect(parseScaledGoalGrade('V0', 'boulder')).toBe(0);
	expect(parseScaledGoalGrade('VB', 'boulder')).toBe(-1);
	expect(parseScaledGoalGrade('6A', 'boulder')).toBeCloseTo(3.12);
	expect(parseScaledGoalGrade('5.11c', 'route')).not.toBeNull();
	expect(parseScaledGoalGrade('5', 'route')).toBe(5);
	expect(parseScaledGoalGrade('5', 'boulder')).toBe(5);
	expect(parseScaledGoalGrade('V5', 'route')).toBeNull();
	expect(parseScaledGoalGrade('5.11c', 'boulder')).toBeNull();
	expect(parseScaledGoalGrade('6a', 'route')).toBeGreaterThan(18);
	expect(parseScaledGoalGrade('', 'route')).toBeNull();
	expect(parseGoalGradeScale('v_scale')).toBeNull();
});
