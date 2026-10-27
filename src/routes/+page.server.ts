import { redirect } from '@sveltejs/kit';
import { getDashboardStats, parseGradeSystem, parsePyramidMode } from '#lib/server/analytics';
import { env } from '#lib/server/env';
import { getSyncStatus } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

const COOKIE = 'cs_grade_system';

export const load: PageServerLoad = async ({ cookies, url }) => {
	const fromQuery = url.searchParams.get('system');
	const fromCookie = cookies.get(COOKIE);
	const preferred = parseGradeSystem(fromQuery || fromCookie || env('PREFERRED_GRADE_SYSTEM', 'ewbank'));
	const pyramidMode = parsePyramidMode(url.searchParams.get('pyramid'));

	if (fromQuery && fromQuery !== fromCookie) {
		cookies.set(COOKIE, preferred, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	return {
		stats: getDashboardStats(preferred, { pyramidMode }),
		sync: getSyncStatus(),
		gradeSystem: preferred,
		pyramidMode
	};
};

export const actions: Actions = {
	setGradeSystem: async ({ request, cookies }) => {
		const form = await request.formData();
		const system = parseGradeSystem(String(form.get('system') || 'ewbank'));
		cookies.set(COOKIE, system, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
		throw redirect(303, '/');
	}
};
