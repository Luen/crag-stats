import { fail } from '@sveltejs/kit';
import { parseGoalGradeScale, parseScaledGoalGrade } from '#lib/goalGrades';
import {
	createGoal,
	deleteGoal,
	listGoals,
	setGoalCompleted,
	setGoalGradeScale,
	type GoalKind
} from '#lib/server/goals';
import { listSuggestedGradeGoals } from '#lib/server/suggestedGoals';
import type { Actions, PageServerLoad } from './$types';

// Goals are the owner's: visitors can read progress but never create or change goals.
const NOT_OWNER = { ok: false, message: 'Log in to change goals' };

export const load: PageServerLoad = async ({ locals }) => {
	const goals = listGoals();
	return {
		canEdit: locals.authed,
		goals,
		active: goals.filter((g) => !g.completed),
		achieved: goals.filter((g) => g.completed),
		suggestions: listSuggestedGradeGoals()
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, NOT_OWNER);
		const form = await request.formData();
		const kind = String(form.get('kind') || 'custom') as GoalKind;
		const title = String(form.get('title') || '').trim();
		const targetValue = String(form.get('targetValue') || '').trim() || null;
		const yearRaw = String(form.get('year') || '').trim();
		const gradeRaw = String(form.get('targetGradeScore') || form.get('grade') || '').trim();
		const gradeScale = parseGoalGradeScale(form.get('gradeScale'));
		const venueScope = String(form.get('venueScope') || '').trim() || null;
		if (!title) return fail(400, { ok: false, message: 'Title is required' });

		const year = yearRaw ? Number(yearRaw) : null;
		if (kind === 'grade' && !gradeScale)
			return fail(400, { ok: false, message: 'Choose route or boulder grades' });
		let targetGradeScore =
			gradeRaw && gradeScale ? parseScaledGoalGrade(gradeRaw, gradeScale) : null;
		if (kind === 'grade' && targetGradeScore == null && targetValue) {
			targetGradeScore = gradeScale ? parseScaledGoalGrade(targetValue, gradeScale) : null;
		}
		if (kind === 'grade' && (targetGradeScore == null || !Number.isFinite(targetGradeScore))) {
			return fail(400, {
				ok: false,
				message: 'Enter a target grade (e.g. 25, 7a, V5) or numeric score'
			});
		}

		createGoal({
			kind,
			title,
			targetValue: kind === 'grade' ? String(targetGradeScore) : targetValue,
			year: year != null && Number.isFinite(year) ? year : null,
			targetGradeScore,
			gradeScale: gradeScale ?? undefined,
			suggested: form.get('suggested') === '1',
			venueScope
		});
		return { ok: true };
	},
	scale: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, NOT_OWNER);
		const form = await request.formData();
		const id = Number(form.get('id'));
		const scale = parseGoalGradeScale(form.get('gradeScale'));
		if (!Number.isInteger(id) || !scale)
			return fail(400, { ok: false, message: 'Choose route or boulder grades' });
		if (!setGoalGradeScale(id, scale, form.get('suggested') === '1'))
			return fail(404, { ok: false, message: 'Grade goal not found' });
		return { ok: true };
	},
	complete: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, NOT_OWNER);
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		setGoalCompleted(id, true);
		return { ok: true };
	},
	reopen: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, NOT_OWNER);
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		setGoalCompleted(id, false);
		return { ok: true };
	},
	delete: async ({ request, locals }) => {
		if (!locals.authed) return fail(403, NOT_OWNER);
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		deleteGoal(id);
		return { ok: true };
	}
};
