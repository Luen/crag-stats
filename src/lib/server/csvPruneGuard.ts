/**
 * CSV sync treats a successful export as source of truth and prunes local ascents
 * missing from the file (#217). These guards refuse the whole sync (no upsert, no
 * prune) when the export looks truncated versus what we already store.
 */

/** Only apply the remaining-ratio check once the local logbook is this large. */
export const CSV_PRUNE_MIN_LOCAL = 100;

/**
 * Export must retain at least this fraction of the local ascent count, or we assume
 * a bad/partial download (e.g. 1000 local → 230 export ≈ 23% remaining).
 */
export const CSV_PRUNE_MIN_REMAINING_RATIO = 0.5;

export type CsvPruneGuardResult =
	{ ok: true } | { ok: false; reason: 'empty-export' | 'massive-drop'; message: string };

/**
 * Decide whether a CSV export is plausible enough to upsert + prune against.
 * Pure — call before any DB writes so a refused sync leaves the cache unchanged.
 */
export function assessCsvExportForPrune(
	localCount: number,
	exportCount: number
): CsvPruneGuardResult {
	if (exportCount === 0 && localCount > 0) {
		return {
			ok: false,
			reason: 'empty-export',
			message:
				`Refusing CSV sync: export has 0 ascents but the local logbook has ${localCount}. ` +
				'This usually means a failed or truncated download.'
		};
	}
	if (
		localCount >= CSV_PRUNE_MIN_LOCAL &&
		exportCount < localCount &&
		exportCount / localCount < CSV_PRUNE_MIN_REMAINING_RATIO
	) {
		const pct = Math.round((1 - CSV_PRUNE_MIN_REMAINING_RATIO) * 100);
		return {
			ok: false,
			reason: 'massive-drop',
			message:
				`Refusing CSV sync: export has ${exportCount} ascents but the local logbook has ${localCount} ` +
				`(more than a ${pct}% drop in one run). Unlikely to be real deletes in a single day — ` +
				'fix the download, or wipe local data in Settings if the export is correct.'
		};
	}
	return { ok: true };
}

/** Throws with the guard message when the export must not be applied. */
export function assertCsvExportPlausibleForPrune(localCount: number, exportCount: number): void {
	const result = assessCsvExportForPrune(localCount, exportCount);
	if (!result.ok) throw new Error(result.message);
}
