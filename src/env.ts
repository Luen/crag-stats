import { defineEnvVars } from '@sveltejs/kit/env';

/** Accept missing/empty values so local + Docker configs stay flexible. */
const optionalString = (value: string | undefined) => value ?? '';

export const variables = defineEnvVars({
	THECRAG_API_KEY: {
		description: 'Personal theCrag Logbook Read API key (Supporters)',
		schema: optionalString
	},
	THECRAG_LOGBOOK_MODE: {
		description:
			'Logbook source: api (default, uses THECRAG_API_KEY) or csv (upload/ingest only; THECRAG_API_KEY is then used for route data and area lookups only)',
		schema: optionalString
	},
	THECRAG_OWNER_LOGIN: {
		description:
			'Opt-in: theCrag @login used for FA/FFA matching when the logbook arrives by CSV instead of API sync',
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
	IMPORT_CRON: {
		description:
			'node-cron expression for background route data and weather imports (default daily; off disables)',
		schema: optionalString
	},
	ROUTE_DATA_IMPORT: {
		description:
			'Opt-in: fetch route data (details + public FA/FFA history) from theCrag in the background, 100 routes per run (default false). Replaces ROUTE_HISTORY_IMPORT, which is ignored',
		schema: optionalString
	},
	ROUTE_DATA_REFRESH_DAYS: {
		description:
			'Opt-in route data refresh: whole days 30–3650 (e.g. 90, 180); unset/0/<30/>3650 disables (requires ROUTE_DATA_IMPORT)',
		schema: optionalString
	},
	WEATHER_IMPORT: {
		description:
			'Opt-in: fetch daily outdoor weather from Open-Meteo for badge enrichment (default false; non-commercial self-host OK)',
		schema: optionalString
	},
	CSV_INGEST_TOKEN: {
		description:
			'Opt-in: bearer token for POST /api/logbook/csv, so a companion uploader can submit a CSV export (unset disables the endpoint)',
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
