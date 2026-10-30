import { fail } from '@sveltejs/kit';
import {
	DASH_LAYOUT_COOKIE,
	defaultLayout,
	parseLayoutCookie,
	resolveDashLayout,
	serializeLayout
} from '#lib/dashboardLayout';
import { parseGradeSystem, wipeAllData } from '#lib/server/analytics';
import {
	deleteAppSetting,
	getAppSetting,
	getPreferredGradeSystem,
	getSearchIndexing,
	getShowNotes,
	setAppSetting
} from '#lib/server/appSettings';
import { hasTheCragApiKey, getTheCragSyncConfiguration } from '#lib/server/env';
import { privateNotesSyncAvailable } from '#lib/server/notes';
import { forgetTheCragSession } from '#lib/server/theCragWebSession';
import { beginFirstImport, completeFirstImport } from '#lib/server/firstImport';
import { db } from '#lib/server/db';
import { upsertAscents } from '#lib/server/ingest';
import { parseTheCragCsv } from '#lib/server/providers/thecrag';
import { refreshProjects } from '#lib/server/projects';
import {
	getRouteHistoryStatus,
	isRouteHistoryImportEnabled,
	reapplyRouteHistoryMarks,
	refreshAllRouteHistory,
	runRouteHistoryImport
} from '#lib/server/routeHistoryImport';
import { getSyncStatus, runTheCragSync } from '#lib/server/sync';
import {
	getWeatherImportStatus,
	isWeatherImportEnabled,
	runWeatherImport
} from '#lib/server/weatherImport';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
	return {
		serverNow: Date.now(),
		sync: getSyncStatus(),
		hasApiKey: hasTheCragApiKey(),
		syncConfiguration: getTheCragSyncConfiguration(),
		gradeSystem: getPreferredGradeSystem(),
		searchIndexing: getSearchIndexing(),
		showNotes: getShowNotes(),
		dashLayout: resolveDashLayout(
			getAppSetting('dashboard_layout'),
			cookies.get(DASH_LAYOUT_COOKIE)
		),
		routeHistory: getRouteHistoryStatus(),
		weatherImport: getWeatherImportStatus()
	};
};

export const actions: Actions = {
	forgetTheCragSession: async ({ locals }) => {
		if (!locals.authed) return fail(403);
		forgetTheCragSession();
		return { ok: true, sessionForgotten: true };
	},
	// Site-wide dashboard layout (#37). /settings is already gated; check again anyway.
	saveDashboardLayout: async ({ request, cookies, locals }) => {
		if (!locals.authed) return fail(403);
		const form = await request.formData();
		const raw = String(form.get('layout') || '');
		const layout = raw ? parseLayoutCookie(raw) : defaultLayout();
		setAppSetting('dashboard_layout', serializeLayout(layout));
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		return { ok: true, layoutSaved: true };
	},
	resetDashboardLayout: async ({ cookies, locals }) => {
		if (!locals.authed) return fail(403);
		deleteAppSetting('dashboard_layout');
		cookies.delete(DASH_LAYOUT_COOKIE, { path: '/' });
		return { ok: true, layoutSaved: true };
	},
	savePreferences: async ({ request }) => {
		const form = await request.formData();
		setAppSetting('grade_system', parseGradeSystem(String(form.get('system') || 'ewbank')));
		// Checkbox: absent when unticked. Ignored while AUTH_SCOPE=all forces it off.
		if (!getSearchIndexing().forcedOff) {
			setAppSetting('search_indexing', form.get('indexing') === 'on' ? 'on' : 'off');
		}
		// CSV cannot newly enable notes, but owners must always be able to hide
		// comments/private notes retained from a previous import mode.
		if (
			privateNotesSyncAvailable(getTheCragSyncConfiguration().mode) ||
			form.get('notes') !== 'on'
		) {
			setAppSetting('show_notes', form.get('notes') === 'on' ? 'on' : 'off');
		}
		return { ok: true, saved: true };
	},
	sync: async ({ locals }) => {
		if (!locals.authed) return fail(403);
		try {
			const result = await runTheCragSync();
			return { ok: true, result };
		} catch (err) {
			return fail(400, {
				ok: false,
				message: err instanceof Error ? err.message : String(err)
			});
		}
	},
	fullSync: async ({ locals }) => {
		if (!locals.authed) return fail(403);
		try {
			const result = await runTheCragSync({ full: true });
			return { ok: true, result };
		} catch (err) {
			return fail(400, {
				ok: false,
				message: err instanceof Error ? err.message : String(err)
			});
		}
	},
	importCsv: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('file');
		if (!(file instanceof File)) {
			return fail(400, { ok: false, message: 'Choose a CSV file' });
		}
		const buf = Buffer.from(await file.arrayBuffer());
		try {
			const ascents = parseTheCragCsv(buf);
			const result = db.transaction(() => {
				const token = beginFirstImport();
				const created = upsertAscents(ascents);
				refreshProjects();
				completeFirstImport(ascents.length, token);
				return created;
			});
			return { ok: true, imported: ascents.length, created: result };
		} catch (err) {
			return fail(400, {
				ok: false,
				message: err instanceof Error ? err.message : String(err)
			});
		}
	},
	wipe: async ({ request }) => {
		const form = await request.formData();
		if (form.get('confirm') !== 'DELETE') {
			return fail(400, { ok: false, message: 'Type DELETE to confirm' });
		}
		wipeAllData();
		return { ok: true, wiped: true };
	},
	// Route history (#68), opt-in via ROUTE_HISTORY_IMPORT. /settings is already owner-gated.
	/** Check the next 100 unchecked routes and report the real engine outcome (busy/waiting/done/ran). */
	fetchRouteHistory: async ({ locals }) => {
		if (!locals.authed) return fail(403);
		if (!isRouteHistoryImportEnabled()) {
			return fail(400, { ok: false, message: 'Set ROUTE_HISTORY_IMPORT=true to enable this.' });
		}
		const result = await runRouteHistoryImport();
		if (!result.ok) {
			if (result.outcome === 'waiting') {
				return fail(400, { ok: false, routeHistoryWaiting: true });
			}
			return fail(400, { ok: false, message: result.message, routeHistoryMessage: result.message });
		}
		return { ok: true, routeHistoryMessage: result.message };
	},
	/** Re-apply FA/FFA marks from history already cached locally (no requests to theCrag). */
	reapplyRouteHistory: async ({ request, locals }) => {
		if (!locals.authed) return fail(403);
		if (!isRouteHistoryImportEnabled()) {
			return fail(400, { ok: false, message: 'Set ROUTE_HISTORY_IMPORT=true to enable this.' });
		}
		const form = await request.formData();
		const { marked, routes } = reapplyRouteHistoryMarks({
			replaceExisting: form.get('replaceExisting') === 'on',
			reapplyUnmarked: form.get('reapplyUnmarked') === 'on'
		});
		return {
			ok: true,
			routeHistoryMessage: `Re-applied cached history for ${routes} routes: ${marked} marks changed.`
		};
	},
	/** Forget which routes were checked, so they're fetched again gradually (100 per run). */
	refreshRouteHistory: async ({ request, locals }) => {
		if (!locals.authed) return fail(403);
		if (!isRouteHistoryImportEnabled()) {
			return fail(400, { ok: false, message: 'Set ROUTE_HISTORY_IMPORT=true to enable this.' });
		}
		const form = await request.formData();
		if (String(form.get('confirm') || '') !== 'REFRESH') {
			return fail(400, { ok: false, message: 'Type REFRESH to confirm' });
		}
		const n = refreshAllRouteHistory();
		return {
			ok: true,
			routeHistoryMessage: `${n} routes will be checked again, ${getRouteHistoryStatus().perRun} per run. After they re-fetch, use Re-apply from saved history (with Replace existing if needed) to update marks.`
		};
	},
	/** Fetch the next batch of outdoor weather days from Open-Meteo (#268). */
	fetchWeather: async ({ locals }) => {
		if (!locals.authed) return fail(403);
		if (!isWeatherImportEnabled()) {
			return fail(400, { ok: false, message: 'Set WEATHER_IMPORT=true to enable this.' });
		}
		const result = await runWeatherImport();
		if (!result.ok) {
			if (result.outcome === 'waiting') {
				return fail(400, { ok: false, weatherWaiting: true });
			}
			return fail(400, { ok: false, message: result.message, weatherMessage: result.message });
		}
		return { ok: true, weatherMessage: result.message };
	}
};
