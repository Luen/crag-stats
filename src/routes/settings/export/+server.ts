import { exportLogbookCsv } from '#lib/server/exportCsv';

/** GET /settings/export — download local logbook as CSV. */
export function GET() {
	const csv = exportLogbookCsv();
	const stamp = new Date().toISOString().slice(0, 10);
	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv; charset=utf-8',
			'Content-Disposition': `attachment; filename="crag-stats-logbook-${stamp}.csv"`
		}
	});
}
