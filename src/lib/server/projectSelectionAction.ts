import { fail, redirect } from '@sveltejs/kit';
import { db, ensureSchema } from './db';
import { refreshProjects } from './projects';
import { setProjectOverride } from './projectOverrides';

export async function saveProjectSelection(
	{
		request,
		locals
	}: {
		request: Request;
		locals: App.Locals;
	},
	redirectAfterSave = true
) {
	if (!locals.authed) return fail(403, { message: 'Sign in to change project selection.' });
	const form = await request.formData();
	const provider = form.get('provider');
	const route = form.get('route');
	const decision = form.get('decision');
	if (
		typeof provider !== 'string' ||
		typeof route !== 'string' ||
		(decision !== 'auto' && decision !== 'include' && decision !== 'exclude')
	) {
		return fail(400, { message: 'Choose automatic detection, include or dismiss.' });
	}
	ensureSchema();
	const saved = db.transaction(() => {
		if (!setProjectOverride(provider, route, decision)) return false;
		refreshProjects();
		return true;
	});
	if (!saved)
		return fail(400, { message: 'Choose a logged outdoor route to include as a project.' });
	if (redirectAfterSave) redirect(303, '/projects');
	return { ok: true };
}
