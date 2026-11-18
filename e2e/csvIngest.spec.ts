import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { PORTS, TEST_CSV_TOKEN } from '../playwright.config';

/**
 * `POST /api/logbook/csv` lets a companion uploader refresh an install that has no
 * supporter API key. It authenticates with its own token, never the browser session,
 * so it keeps working on the `AUTH_SCOPE=all` server (whole UI gated) and fails
 * closed where no token is configured.
 */
const allOrigin = `http://localhost:${PORTS.all}`;
const csv = readFileSync('samples/thecrag-logbook-sample.csv');
const url = `${allOrigin}/api/logbook/csv`;

test('CSV ingest endpoint accepts a token-authenticated upload and rejects bad input', async ({
	request
}) => {
	const anonymous = await request.post(url, {
		headers: { 'content-type': 'text/csv' },
		data: csv
	});
	expect(anonymous.status()).toBe(401);

	const wrongToken = await request.post(url, {
		headers: { authorization: 'Bearer not-the-token', 'content-type': 'text/csv' },
		data: csv
	});
	expect(wrongToken.status()).toBe(401);

	const accepted = await request.post(url, {
		headers: { authorization: `Bearer ${TEST_CSV_TOKEN}`, 'content-type': 'text/csv' },
		data: csv
	});
	expect(accepted.status()).toBe(200);
	const summary = await accepted.json();
	expect(summary.ok).toBe(true);
	expect(summary.imported).toBeGreaterThan(0);
	expect(summary.created.ascents).toBe(summary.imported);

	// Upsert-only: the same export again refreshes every ascent but adds none.
	const repeat = await request.post(url, {
		headers: { 'x-csv-token': TEST_CSV_TOKEN, 'content-type': 'text/csv' },
		data: csv
	});
	expect(repeat.status()).toBe(200);
	const repeatSummary = await repeat.json();
	expect(repeatSummary.imported).toBe(summary.imported);
	expect(repeatSummary.created.ascents).toBe(0);

	// A saved login page is reported, not imported as an empty success.
	const html = await request.post(url, {
		headers: { authorization: `Bearer ${TEST_CSV_TOKEN}`, 'content-type': 'text/html' },
		data: '<!doctype html><html><body><form>Sign in</form></body></html>'
	});
	expect(html.status()).toBe(400);
	expect((await html.json()).ok).toBe(false);
});

test('CSV ingest endpoint stays disabled without a configured token', async ({ request }) => {
	const res = await request.post(`http://localhost:${PORTS.open}/api/logbook/csv`, {
		headers: { 'content-type': 'text/csv' },
		data: csv
	});
	expect(res.status()).toBe(503);
});
