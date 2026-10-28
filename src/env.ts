import { defineEnvVars } from '@sveltejs/kit/env';

/** Accept missing/empty values so local + Docker configs stay flexible. */
const optionalString = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	THECRAG_API_KEY: {
		description: 'Personal theCrag Logbook Read API key (Supporters)',
		schema: optionalString
	},
	APP_PASSWORD: {
		description: 'Optional password gate for the UI',
		schema: optionalString
	},
	AUTH_SCOPE: {
		description: 'Password gate scope: settings (default) or all',
		schema: optionalString
	},
	SESSION_SECRET: {
		description: 'Cookie signing + worker shared secret',
		schema: optionalString
	},
	DATABASE_PATH: {
		description: 'SQLite database file path',
		schema: optionalString
	},
	SYNC_CRON: {
		description: 'node-cron expression for daily sync',
		schema: optionalString
	},
	PREFERRED_GRADE_SYSTEM: {
		description: 'Display grade system preference',
		schema: optionalString
	},
	SHOW_PRIVATE_NOTES: {
		description:
			'Show private ascent notes to the owner (true/false, default false; Settings overrides)',
		schema: optionalString
	},
	ROUTE_HISTORY_IMPORT: {
		description:
			'Opt-in: fetch public FA/FFA route history from theCrag in the background, 20 routes per run (default false)',
		schema: optionalString
	},
	DISPLAY_LOCALE: {
		description: 'Locale for dates/numbers (BCP 47, default en-AU)',
		schema: optionalString
	},
	TZ: {
		description: 'Time zone for displayed times (IANA, e.g. Australia/Brisbane)',
		schema: optionalString
	},
	HOST: {
		description: 'Listen host',
		schema: optionalString
	},
	PORT: {
		description: 'Listen port',
		schema: optionalString
	},
	APP_INTERNAL_URL: {
		description: 'Internal URL used by the Docker worker to reach the app',
		schema: optionalString
	},
	NODE_ENV: {
		description: 'Node environment',
		schema: optionalString
	}
});
