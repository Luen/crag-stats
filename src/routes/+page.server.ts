import { redirect } from '@sveltejs/kit';
import {
	DASH_LAYOUT_COOKIE,
	defaultLayout,
	parseLayoutCookie,
	serializeLayout
} from '#lib/dashboardLayout';
import { getDashboardStats, parseGradeSystem, parsePyramidMode } from '#lib/server/analytics';
import { env } from '#lib/server/env';
import { listActiveGoals } from '#lib/server/goals';
import { listDashboardProjects } from '#lib/server/projects';
import { getSyncStatus } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

const GRADE_COOKIE = 'cs_grade_system';

const layoutCookieOpts = {
	path: '/',
	maxAge: 60 * 60 * 24 * 365,
	sameSite: 'lax' as const
};

export const load: PageServerLoad = async ({ cookies, url }) => {
	const fromQuery = url.searchParams.get('system');
	const fromCookie = cookies.get(GRADE_COOKIE);
	const preferred = parseGradeSystem(fromQuery || fromCookie || env('PREFERRED_GRADE_SYSTEM', 'ewbank'));
	const pyramidMode = parsePyramidMode(url.searchParams.get('pyramid'));

	if (fromQuery && fromQuery !== fromCookie) {
		cookies.set(GRADE_COOKIE, preferred, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

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
	setGradeSystem: async ({ request, cookies }) => {
		const form = await request.formData();
		const system = parseGradeSystem(String(form.get('system') || 'ewbank'));
		cookies.set(GRADE_COOKIE, system, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
		throw redirect(303, '/');
	},

	setDashboardLayout: async ({ request, cookies }) => {
		const form = await request.formData();
		const raw = String(form.get('layout') || '');
		const layout = raw ? parseLayoutCookie(raw) : defaultLayout();
		cookies.set(DASH_LAYOUT_COOKIE, serializeLayout(layout), layoutCookieOpts);
		throw redirect(303, '/');
	},

	resetDashboardLayout: async ({ cookies }) => {
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		throw redirect(303, '/');
	}
};
