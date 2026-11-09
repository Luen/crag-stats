import { afterEach, expect, it, vi } from 'vitest';
import { fetchTheCragPage, syncTheCragAll } from './api';

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
		'theCrag API 400 (page 4): Logbook access was denied.'
	);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.toThrow(
		'upload your logbook CSV in Settings'
	);
	await expect(fetchTheCragPage('synthetic-secret')).rejects.not.toThrow('synthetic-secret');
});

it.each([
	[401, 'Logbook access was denied'],
	[403, 'Logbook access was denied'],
	[429, 'Request limit reached'],
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
	await expect(syncTheCragAll('synthetic-secret', {}, onPage)).rejects.toThrow('(page 2)');
	expect(onPage).toHaveBeenCalledOnce();
	await syncTheCragAll('synthetic-secret', {}, onPage);
	expect(fetch.mock.calls.map(([url]) => new URL(url).searchParams.get('page'))).toEqual([
		'1',
		'2',
		'1',
		'2'
	]);
});
