import type { SupportedLocale } from '#lib/i18n';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** True when no APP_PASSWORD, or session cookie is valid */
			authed: boolean;
			/** Interface language resolved once per request (see hooks.server.ts). */
			locale: SupportedLocale;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
