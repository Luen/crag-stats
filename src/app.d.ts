declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** True when no APP_PASSWORD, or session cookie is valid */
			authed: boolean;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
