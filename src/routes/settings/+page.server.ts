import { fail } from '@sveltejs/kit';
import { parseGradeSystem, wipeAllData } from '#lib/server/analytics';
import {
	getPreferredGradeSystem,
	getSearchIndexing,
	getShowNotes,
	setAppSetting
} from '#lib/server/appSettings';
import { hasTheCragApiKey } from '#lib/server/env';
import { upsertAscents } from '#lib/server/ingest';
import { parseTheCragCsv } from '#lib/server/providers/thecrag';
import { refreshProjects } from '#lib/server/projects';
import { getSyncStatus, runTheCragSync } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		sync: getSyncStatus(),
		hasApiKey: hasTheCragApiKey(),
		gradeSystem: getPreferredGradeSystem(),
		searchIndexing: getSearchIndexing(),
		showNotes: getShowNotes()
	};
};

export const actions: Actions = {
	savePreferences: async ({ request }) => {
		const form = await request.formData();
		setAppSetting('grade_system', parseGradeSystem(String(form.get('system') || 'ewbank')));
		// Checkbox: absent when unticked. Ignored while AUTH_SCOPE=all forces it off.
		if (!getSearchIndexing().forcedOff) {
			setAppSetting('search_indexing', form.get('indexing') === 'on' ? 'on' : 'off');
		}
		setAppSetting('show_notes', form.get('notes') === 'on' ? 'on' : 'off');
		return { ok: true, saved: true };
	},
	sync: async () => {
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
	fullSync: async () => {
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
			const result = upsertAscents(ascents);
			refreshProjects();
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
	}
};
