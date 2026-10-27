import { fail, redirect } from '@sveltejs/kit';
import {
	DASH_LAYOUT_COOKIE,
	defaultLayout,
	parseLayoutCookie,
	resolveDashLayout,
	serializeLayout
} from '#lib/dashboardLayout';
import { getDashboardStats, parseGradeSystem, parsePyramidMode } from '#lib/server/analytics';
import {
	deleteAppSetting,
	getAppSetting,
	getPreferredGradeSystem,
	setAppSetting
} from '#lib/server/appSettings';
import { listActiveGoals } from '#lib/server/goals';
import { listDashboardProjects } from '#lib/server/projects';
import { getSyncStatus } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url }) => {
	// Site default from Settings; `?system=` is a one-off override for shared links.
	const fromQuery = url.searchParams.get('system');
	const preferred = fromQuery ? parseGradeSystem(fromQuery) : getPreferredGradeSystem();
	const pyramidMode = parsePyramidMode(url.searchParams.get('pyramid'));

	const stats = getDashboardStats(preferred, { pyramidMode });
	return {
		stats,
		// Share-preview text (#44); the layout only emits it when indexing is allowed.
		og: {
			title: stats.profileName ? `${stats.profileName}'s crag year · Crag Stats` : 'Crag Stats',
			description:
				stats.blurb.paragraphs[0] ??
				'Self-hosted climbing analytics for a theCrag logbook: grade pyramids, CPR, projects and goals.'
		},
		sync: getSyncStatus(),
		gradeSystem: preferred,
		pyramidMode,
		activeGoals: listActiveGoals(3),
		dashboardProjects: listDashboardProjects(3),
		// Site-wide so visitors see the owner's layout (#37); cookie is a legacy fallback.
		dashLayout: resolveDashLayout(
			getAppSetting('dashboard_layout'),
			cookies.get(DASH_LAYOUT_COOKIE)
		)
	};
};

export const actions: Actions = {
	setDashboardLayout: async ({ request, cookies, locals }) => {
		if (!locals.authed) return fail(403);
		const form = await request.formData();
		const raw = String(form.get('layout') || '');
		const layout = raw ? parseLayoutCookie(raw) : defaultLayout();
		setAppSetting('dashboard_layout', serializeLayout(layout));
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		throw redirect(303, '/');
	},

	resetDashboardLayout: async ({ cookies, locals }) => {
		if (!locals.authed) return fail(403);
		deleteAppSetting('dashboard_layout');
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		throw redirect(303, '/');
	}
};
