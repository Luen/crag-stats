import { fail } from '@sveltejs/kit';
import { wipeAllData } from '#lib/server/analytics';
import { hasTheCragApiKey } from '#lib/server/env';
import { upsertAscents } from '#lib/server/ingest';
import { parseTheCragCsv } from '#lib/server/providers/thecrag';
import { refreshProjects } from '#lib/server/projects';
import { getSyncStatus, runTheCragSync } from '#lib/server/sync';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		sync: getSyncStatus(),
		hasApiKey: hasTheCragApiKey()
	};
};

export const actions: Actions = {
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
