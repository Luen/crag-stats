import { fail, redirect } from '@sveltejs/kit';
import {
	createSessionToken,
	isAuthEnabled,
	sessionCookieName,
	verifyPassword
} from '#lib/server/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	if (!isAuthEnabled()) {
		throw redirect(303, '/');
	}
	return { next: url.searchParams.get('next') || '/' };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const form = await request.formData();
		const password = String(form.get('password') || '');
		const next = String(form.get('next') || '/');
		if (!verifyPassword(password)) {
			return fail(401, { message: 'Incorrect password' });
		}
		cookies.set(sessionCookieName(), createSessionToken(), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 60 * 60 * 24 * 30
		});
		throw redirect(303, next.startsWith('/') ? next : '/');
	}
};
