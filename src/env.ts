import { defineEnvVars } from '@sveltejs/kit/env';

/** Accept missing/empty values so local + Docker configs stay flexible. */
const optionalString = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	THECRAG_SYNC_MODE: {
		description: 'Logbook sync source: api (default) or csv (saved login session)',
		schema: optionalString
	},
	THECRAG_USERNAME: {
		description: 'theCrag username for opt-in CSV downloads (not email)',
		schema: optionalString
	},
	THECRAG_PASSWORD: {
		description: 'theCrag password for opt-in CSV downloads',
		schema: optionalString
	},
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
	ROUTE_HISTORY_IMPORT: {
		description:
			'Opt-in: fetch public FA/FFA route history from theCrag in the background, 100 routes per run (default false)',
		schema: optionalString
	},
	ROUTE_DATA_REFRESH_DAYS: {
		description:
			'Opt-in route data refresh: whole days 30–3650 (e.g. 90, 180); unset/0/<30/>3650 disables (requires ROUTE_HISTORY_IMPORT)',
		schema: optionalString
	},
	WEATHER_IMPORT: {
		description:
			'Opt-in: fetch daily outdoor weather from Open-Meteo for badge enrichment (default false; non-commercial self-host OK)',
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
