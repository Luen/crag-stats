import { fail } from '@sveltejs/kit';
import {
	createGoal,
	deleteGoal,
	listGoals,
	setGoalCompleted,
	type GoalKind
} from '#lib/server/goals';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return { goals: listGoals() };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const form = await request.formData();
		const kind = String(form.get('kind') || 'custom') as GoalKind;
		const title = String(form.get('title') || '').trim();
		const targetValue = String(form.get('targetValue') || '').trim() || null;
		const yearRaw = String(form.get('year') || '').trim();
		const gradeRaw = String(form.get('targetGradeScore') || '').trim();
		if (!title) return fail(400, { ok: false, message: 'Title is required' });

		const year = yearRaw ? Number(yearRaw) : null;
		const targetGradeScore = gradeRaw ? Number(gradeRaw) : null;

		createGoal({
			kind,
			title,
			targetValue,
			year: year != null && Number.isFinite(year) ? year : null,
			targetGradeScore:
				targetGradeScore != null && Number.isFinite(targetGradeScore) ? targetGradeScore : null
		});
		return { ok: true };
	},
	complete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		setGoalCompleted(id, true);
		return { ok: true };
	},
	reopen: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		setGoalCompleted(id, false);
		return { ok: true };
	},
	delete: async ({ request }) => {
		const form = await request.formData();
		const id = Number(form.get('id'));
		if (!Number.isFinite(id)) return fail(400, { ok: false, message: 'Invalid goal' });
		deleteGoal(id);
		return { ok: true };
	}
};
