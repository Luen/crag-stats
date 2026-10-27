import { fail, redirect } from '@sveltejs/kit';
import {
	DASH_LAYOUT_COOKIE,
	defaultLayout,
	parseLayoutCookie,
	serializeLayout
} from '#lib/dashboardLayout';
import { getDashboardStats, parseGradeSystem, parsePyramidMode } from '#lib/server/analytics';
import { getPreferredGradeSystem } from '#lib/server/appSettings';
import { listActiveGoals } from '#lib/server/goals';
import { listDashboardProjects } from '#lib/server/projects';
import { getSyncStatus } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

const layoutCookieOpts = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365,
	sameSite: 'lax' as const
};

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Site default from Settings; `?system=` is a one-off override for shared links.
	const fromQuery = url.searchParams.get('system');
	const preferred = fromQuery ? parseGradeSystem(fromQuery) : getPreferredGradeSystem();
	const pyramidMode = parsePyramidMode(url.searchParams.get('pyramid'));

	return {
		stats: getDashboardStats(preferred, { pyramidMode }),
		sync: getSyncStatus(),
		gradeSystem: preferred,
		pyramidMode,
		activeGoals: listActiveGoals(3),
		dashboardProjects: listDashboardProjects(3),
		dashLayout: parseLayoutCookie(cookies.get(DASH_LAYOUT_COOKIE))
	};
};

export const actions: Actions = {
	setDashboardLayout: async ({ request, cookies, locals }) => {
		if (!locals.authed) return fail(403);
		const form = await request.formData();
		const raw = String(form.get('layout') || '');
		const layout = raw ? parseLayoutCookie(raw) : defaultLayout();
		cookies.set(DASH_LAYOUT_COOKIE, serializeLayout(layout), layoutCookieOpts);
		throw redirect(303, '/');
	},

	resetDashboardLayout: async ({ cookies, locals }) => {
		if (!locals.authed) return fail(403);
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		throw redirect(303, '/');
	}
};
