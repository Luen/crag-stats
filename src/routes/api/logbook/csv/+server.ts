/**
 * POST /api/logbook/csv — owner-only CSV ingest for a companion uploader.
 *
 * Auth is `CSV_INGEST_TOKEN` (`x-csv-token` or `Authorization: Bearer …`), not the
 * browser session, so a scheduled container can refresh a self-hosted install
 * without a supporter API key. Upsert-only: it never prunes ascents missing from
 * the file, and it makes no request to theCrag.
 *
 * Body: the raw theCrag export (`Content-Type: text/csv`), or a multipart form
 * with the file in a `file` field.
 */
import { json } from '@sveltejs/kit';
import { verifySharedSecret } from '#lib/server/auth';
import { env } from '#lib/server/env';
import {
	CsvIngestError,
	csvUploadToken,
	ingestLogbookCsv,
	readCappedBody,
	MAX_CSV_BYTES
} from '#lib/server/csvIngest';
import type { RequestHandler } from './$types';

const NO_STORE = { 'cache-control': 'no-store' };

function failure(status: number, error: string) {
	return json({ ok: false, error }, { status, headers: NO_STORE });
}

/** Accept a raw CSV body, or a multipart form with the export in `file`. */
async function uploadedCsv(request: Request, body: Buffer): Promise<Buffer> {
	const type = request.headers.get('content-type') ?? '';
	if (!type.toLowerCase().startsWith('multipart/form-data')) return body;
	const form = await new Response(new Uint8Array(body), {
		headers: { 'content-type': type }
	}).formData();
	const file = form.get('file');
	if (!(file instanceof File)) {
		throw new CsvIngestError('invalid', 'Attach the CSV export as a "file" field.');
	}
	return Buffer.from(await file.arrayBuffer());
}

export const POST: RequestHandler = async ({ request }) => {
	const expected = env('CSV_INGEST_TOKEN').trim();
	if (!expected) {
		return failure(503, 'CSV upload is not enabled. Set CSV_INGEST_TOKEN on the server.');
	}
	if (!verifySharedSecret(csvUploadToken(request.headers), expected)) {
		return failure(401, 'Invalid CSV upload token.');
	}

	const tooLarge = failure(413, `CSV upload exceeds ${MAX_CSV_BYTES} bytes.`);
	const declared = Number(request.headers.get('content-length') ?? '0');
	if (Number.isFinite(declared) && declared > MAX_CSV_BYTES) return tooLarge;

	try {
		const body = await readCappedBody(request.body);
		const { imported, created } = ingestLogbookCsv(await uploadedCsv(request, body));
		return json({ ok: true, imported, created }, { headers: NO_STORE });
	} catch (err) {
		if (err instanceof CsvIngestError) {
			return failure(err.reason === 'too_large' ? 413 : 400, err.message);
		}
		// Unexpected failures stay in the server log; the caller gets a fixed message.
		console.error('[csv] ingest failed:', err instanceof Error ? err.message : err);
		return failure(500, 'The CSV export could not be imported.');
	}
};
