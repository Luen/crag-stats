import { afterEach, expect, it, vi } from 'vitest';
import { apiErrorAdvice, fetchTheCragPage, safeErrorLabel, syncTheCragAll } from './api';

afterEach(() => vi.unstubAllGlobals());

it('explains permission failures without echoing credentials or upstream messages', async () => {
	const fetch = vi.fn().mockImplementation(
		async () =>
			new Response(
				JSON.stringify({
					apiKey: 'synthetic-secret',
					error: 'Private upstream details synthetic-secret',
					errorLabel: 'insufficient-api-permissions'
				}),
				{ status: 400 }
			)
	);
	vi.stubGlobal('fetch', fetch);
	await expect(fetchTheCragPage('synthetic-secret', { page: 4 })).rejects.toThrow(
		'theCrag API 400 (page 4, insufficient-api-permissions): Logbook access was denied.'
	);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.toThrow(
		'upload your logbook CSV in Settings'
	);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.not.toThrow('synthetic-secret');
});

it.each([
	[401, 'rejected THECRAG_API_KEY as invalid'],
	[403, 'Logbook access was denied'],
	[429, 'usage limit'],
	[500, 'Sync could not finish'],
	[400, 'Sync could not finish']
])('uses safe advice for HTTP %s, including non-JSON responses', async (status, advice) => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockResolvedValue(
			new Response('private synthetic-secret', {
				status,
				statusText: 'synthetic-secret'
			})
		)
	);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.toThrow(advice);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.not.toThrow('synthetic-secret');
});

it('does not expose transport or JSON parser error details', async () => {
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('synthetic-secret')));
	await expect(fetchTheCragPage('synthetic-secret')).rejects.toThrow(
		'Could not reach theCrag API.'
	);
	vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('synthetic-secret')));
	await expect(fetchTheCragPage('synthetic-secret')).rejects.toThrow('returned invalid JSON');
});

it('stops on a failed later page and starts the next full pull at page 1', async () => {
	const page = async () =>
		new Response(
			JSON.stringify({
				data: {
					ascents: [{ id: 1, route: { id: 2, name: 'Synthetic route' } }],
					perPage: 1,
					numberAscents: 2
				}
			})
		);
	const fetch = vi
		.fn()
		.mockImplementationOnce(page)
		.mockResolvedValueOnce(
			new Response(JSON.stringify({ errorLabel: 'insufficient-api-permissions' }), { status: 400 })
		)
		.mockImplementationOnce(page)
		.mockResolvedValueOnce(new Response(JSON.stringify({ data: { ascents: [] } })));
	vi.stubGlobal('fetch', fetch);
	const onPage = vi.fn();
	await expect(syncTheCragAll('synthetic-secret', {}, onPage)).rejects.toThrow(
		'(page 2, insufficient-api-permissions)'
	);
	expect(onPage).toHaveBeenCalledOnce();
	await syncTheCragAll('synthetic-secret', {}, onPage);
	expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get('page'))).toEqual([
		'1',
		'2',
		'1',
		'2'
	]);
});

it("names an invalid key and shows theCrag's error code, never the body", async () => {
	vi.stubGlobal(
		'fetch',
		vi.fn().mockImplementation(
			async () =>
				new Response(
					JSON.stringify({
						apiKey: 'synthetic-secret',
						error: "Invalid API key 'synthetic-secret'.",
						errorLabel: 'invalid-api-key',
						remote_ip: '192.0.2.1'
					}),
					{ status: 400 }
				)
		)
	);
	const error = await fetchTheCragPage('synthetic-secret').catch((e: Error) => e);
	expect(String(error)).toContain('(page 1, invalid-api-key)');
	expect(String(error)).toContain('rejected THECRAG_API_KEY as invalid');
	expect(String(error)).not.toContain('synthetic-secret');
	expect(String(error)).not.toContain('192.0.2.1');
});

it('treats usage and quota labels as an exhausted key', () => {
	expect(apiErrorAdvice(400, 'api-quota-exceeded')).toContain('usage limit');
	expect(apiErrorAdvice(400, 'daily-usage-limit')).toContain('usage limit');
	expect(apiErrorAdvice(400, 'something-else')).toContain('Sync could not finish');
});

it('keeps only short hyphenated error codes that cannot carry the key', () => {
	expect(safeErrorLabel({ errorLabel: 'Invalid-API-Key' })).toBe('invalid-api-key');
	expect(safeErrorLabel({ errorLabel: 'key abc123' })).toBeNull();
	expect(safeErrorLabel({ errorLabel: 'abc123def' })).toBeNull();
	expect(safeErrorLabel({ errorLabel: 'synthetic-secret' }, 'synthetic-secret')).toBeNull();
	expect(safeErrorLabel({ errorLabel: 'a'.repeat(61) })).toBeNull();
	expect(safeErrorLabel({ errorLabel: 42 })).toBeNull();
	expect(safeErrorLabel(null)).toBeNull();
});
