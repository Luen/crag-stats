import { describe, expect, it } from 'vitest';
import {
	buildSuggestedOutdoorGradeGoals,
	nextGradeStep,
	type SuggestedGoalAscent
} from './suggestedGoals';

function row(partial: Partial<SuggestedGoalAscent> & { ascentDate: string }): SuggestedGoalAscent {
	return {
		isSend: true,
		effectiveGradeScore: 25,
		gradeSystem: 'AU',
		gearStyle: 'sport',
		routeName: 'Test',
		cragName: 'Crag',
		tagsJson: null,
		...partial
	};
}

describe('nextGradeStep', () => {
	it('steps integer max sends by one', () => {
		expect(nextGradeStep(25)).toBe(26);
		expect(nextGradeStep(5)).toBe(6);
		expect(nextGradeStep(5.5)).toBe(6);
	});
});

describe('buildSuggestedOutdoorGradeGoals', () => {
	const now = new Date('2026-06-15T12:00:00Z');

	it('suggests next outdoor route grade from 2-year max', () => {
		const rows = [
			row({ ascentDate: '2025-03-01', effectiveGradeScore: 25, gearStyle: 'sport' }),
			row({ ascentDate: '2025-01-01', effectiveGradeScore: 28, gearStyle: 'sport' }),
			row({ ascentDate: '2023-01-01', effectiveGradeScore: 30, gearStyle: 'sport' }) // older than 2y
		];
		const suggestions = buildSuggestedOutdoorGradeGoals(rows, {
			now,
			preferredSystem: 'ewbank',
			activeGoals: []
		});
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]?.family).toBe('route');
		expect(suggestions[0]?.maxScore).toBe(28);
		expect(suggestions[0]?.targetScore).toBe(29);
		expect(suggestions[0]?.targetLabel).toBe('29');
		expect(suggestions[0]?.alreadyTracking).toBe(false);
	});

	it('suggests boulder separately with V labels', () => {
		const rows = [
			row({
				ascentDate: '2025-08-01',
				effectiveGradeScore: 5,
				gradeSystem: 'v_scale',
				gearStyle: 'boulder'
			})
		];
		const suggestions = buildSuggestedOutdoorGradeGoals(rows, {
			now,
			preferredSystem: 'v_scale',
			activeGoals: []
		});
		expect(suggestions).toHaveLength(1);
		expect(suggestions[0]?.family).toBe('boulder');
		expect(suggestions[0]?.maxLabel).toMatch(/V5/i);
		expect(suggestions[0]?.targetLabel).toMatch(/V6/i);
	});

	it('ignores indoor sends for outdoor suggestions', () => {
		const rows = [
			row({
				ascentDate: '2025-08-01',
				effectiveGradeScore: 30,
				cragName: 'City Climbing Gym',
				gearStyle: 'sport'
			})
		];
		expect(
			buildSuggestedOutdoorGradeGoals(rows, {
				now,
				preferredSystem: 'ewbank',
				activeGoals: []
			})
		).toEqual([]);
	});

	it('marks alreadyTracking when an active outdoor grade goal matches', () => {
		const rows = [row({ ascentDate: '2025-03-01', effectiveGradeScore: 25 })];
		const suggestions = buildSuggestedOutdoorGradeGoals(rows, {
			now,
			preferredSystem: 'ewbank',
			activeGoals: [
				{
					kind: 'grade',
					title: 'Send outdoor 26 in 2026',
					targetValue: '26',
					targetGradeScore: 26,
					year: 2026,
					venueScope: 'outdoor',
					completed: false
				}
			]
		});
		expect(suggestions[0]?.alreadyTracking).toBe(true);
	});
});
