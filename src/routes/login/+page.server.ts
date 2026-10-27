import { fail, redirect } from '@sveltejs/kit';
import {
	createSessionToken,
	isAuthEnabled,
	sessionCookieName,
	sessionCookieOptions,
	verifyPassword
} from '#lib/server/auth';
import {
	checkLoginAllowed,
	clientKeyFromRequest,
	noteLoginAttempt,
	noteLoginFailure,
	noteLoginSuccess
} from '#lib/server/loginRateLimit';
import { safeRedirectPath } from '#lib/server/safeRedirect';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (!isAuthEnabled()) {
		throw redirect(303, '/');
	}
	if (locals.authed) {
		throw redirect(303, safeRedirectPath(url.searchParams.get('next'), '/settings'));
	}
	return { next: safeRedirectPath(url.searchParams.get('next'), '/settings') };
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const form = await request.formData();
		const password = String(form.get('password') || '');
		const next = safeRedirectPath(String(form.get('next') || ''), '/settings');
		const key = clientKeyFromRequest(request, getClientAddress);

		const gate = checkLoginAllowed(key);
		if (!gate.ok) {
			return fail(429, {
				message: gate.message,
				retryAfterSec: gate.retryAfterSec
			});
		}

		noteLoginAttempt(key);

		if (!verifyPassword(password)) {
			const after = noteLoginFailure(key);
			if (!after.ok) {
				return fail(429, {
					message: after.message,
					retryAfterSec: after.retryAfterSec
				});
			}
			return fail(401, {
				message: 'Incorrect password',
				remaining: after.remaining
			});
		}

		noteLoginSuccess(key);
		cookies.set(sessionCookieName(), createSessionToken(), sessionCookieOptions());
		throw redirect(303, next);
	}
};
