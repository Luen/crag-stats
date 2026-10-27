import { redirect } from '@sveltejs/kit';
import { sessionCookieName, sessionCookieOptions } from '#lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

function clearSession(cookies: import('@sveltejs/kit').Cookies) {
	cookies.delete(sessionCookieName(), { path: '/' });
	cookies.set(sessionCookieName(), '', { ...sessionCookieOptions(), maxAge: 0 });
}

export const load: PageServerLoad = async ({ cookies }) => {
	clearSession(cookies);
	throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		clearSession(cookies);
		throw redirect(303, '/login');
	}
};
