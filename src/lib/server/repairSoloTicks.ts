import { eq } from 'drizzle-orm';
import { db } from './db';
import { ascents } from './db/schema';
import { soloTickKind } from '#lib/soloTicks';
import { mapAscent } from './providers/thecrag/api';
import { isTheCragCsvRawJson, mapTheCragCsvRow, type CsvRow } from './providers/thecrag/csv';
/** Repair completion flags only when a cached provider payload confirms the same explicit solo tick. */
export function repairSoloTickFlags() {
	for (const row of db
		.select({
			id: ascents.id,
			provider: ascents.provider,
			tickType: ascents.tickType,
			rawJson: ascents.rawJson
		})
		.from(ascents)
		.all()) {
		const kind = soloTickKind(row.tickType);
		if (!kind || !row.rawJson || row.provider !== 'thecrag') continue;
		let raw;
		try {
			raw = JSON.parse(row.rawJson);
		} catch {
			continue;
		}
		if (!raw || typeof raw !== 'object') continue;
		const mapped = raw.route
			? mapAscent(raw as Parameters<typeof mapAscent>[0])
			: isTheCragCsvRawJson(raw)
				? mapTheCragCsvRow(raw as CsvRow)
				: null;
		if (!mapped || !mapped.isSend || soloTickKind(mapped.tickType) !== kind) continue;
		db.update(ascents).set({ isSend: true, isAttempt: false }).where(eq(ascents.id, row.id)).run();
	}
}
