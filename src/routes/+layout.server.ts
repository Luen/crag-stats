import { readCardPreferences } from '#lib/cardPreferences';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { sql } from 'drizzle-orm';
import { db, ensureSchema } from '#lib/server/db';
import { ascents } from '#lib/server/db/schema';
import { countActiveProjects } from '#lib/server/projects';
import { getAppSetting, getDateFormat, getDisplayUnits, getSearchIndexing } from '#lib/server/appSettings';
import { isAuthEnabled, authScope } from '#lib/server/auth';
import { resolveDateDisplay } from '#lib/dates';
import { DEFAULT_DISPLAY_UNITS } from '#lib/units';
import { DEFAULT_LOCALE, matchSupportedLocale, resolveLocale } from '#lib/i18n';
import { env } from '#lib/server/env';
import { isNoindexPath } from '#lib/server/seo';
import type { LayoutServerLoad } from './$types';

function readAppVersion(): string {
	try {
		const raw = readFileSync(join(process.cwd(), 'package.json'), 'utf8');
		const pkg = JSON.parse(raw) as { version?: string };
		return pkg.version ? `v${pkg.version}` : 'dev';
	} catch {
		return 'dev';
	}
}

/** Sidebar count badges (Dreeve-style). Cheap COUNT(*) queries; never fatal. */
function navCounts(): { ascents: number; projects: number } {
	try {
		ensureSchema();
		const a =
			db
				.select({ n: sql<number>`count(*)` })
				.from(ascents)
				.get()?.n ?? 0;
		// Same "working on" definition as /projects (open + touched within a year).
		const p = countActiveProjects();
		return { ascents: a, projects: p };
	} catch {
		return { ascents: 0, projects: 0 };
	}
}

export const load: LayoutServerLoad = async ({ locals, url, cookies, request }) => {
	if (url.pathname === '/offline')
		return {
			appVersion: readAppVersion(),
			cardPreferences: readCardPreferences(() => undefined),
			githubUrl: 'https://github.com/Luen/crag-stats',
			authed: false,
			authEnabled: true,
			authScope: 'all' as const,
			showSettings: false,
			navCounts: null,
			dateDisplay: resolveDateDisplay('en-AU', 'UTC'),
			displayUnits: DEFAULT_DISPLAY_UNITS,
			locale: DEFAULT_LOCALE,
			noindex: true
		};

	const queryLocale = matchSupportedLocale(url.searchParams.get('locale'));
	if (queryLocale) {
		cookies.set('cs_locale', queryLocale, {
			path: '/',
			maxAge: 31536000,
			sameSite: 'lax',
			httpOnly: false
		});
	}

	const resolvedLocale = resolveLocale({
		query: queryLocale,
		cookie: cookies.get('cs_locale'),
		stored: getAppSetting('locale'),
		displayLocale: env('DISPLAY_LOCALE'),
		acceptLanguage: request.headers.get('accept-language')
	});

	const authOn = isAuthEnabled();
	const scope = authScope();
	const showSettings = !authOn || locals.authed;
	// Don't leak logbook size to a visitor who still has to log in.
	const gated = authOn && scope === 'all' && !locals.authed;
	return {
		appVersion: readAppVersion(),
		cardPreferences: readCardPreferences((key) => cookies.get(key)),
		githubUrl: 'https://github.com/Luen/crag-stats',
		authed: locals.authed,
		authEnabled: authOn,
		authScope: scope,
		showSettings,
		navCounts: gated ? null : navCounts(),
		dateDisplay: resolveDateDisplay(env('DISPLAY_LOCALE'), env('TZ'), getDateFormat()),
		displayUnits: getDisplayUnits(),
		locale: resolvedLocale,
		noindex: isNoindexPath(url.pathname) || !getSearchIndexing().allowed
	};
};
