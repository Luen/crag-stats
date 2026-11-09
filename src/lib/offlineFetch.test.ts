import { afterEach, expect, it, vi } from 'vitest';
import { networkOnlyResponse } from './offlineFetch';

afterEach(() => vi.unstubAllGlobals());

it('returns an uncached HTTP failure when a page preload or data fetch loses connection', async () => {
	vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
	for (const path of ['/sectors', '/map/__data.json']) {
		const response = await networkOnlyResponse(new Request(`https://example.test${path}`));
		expect(response.status).toBe(503);
		expect(response.headers.get('cache-control')).toBe('no-store');
		expect(response.headers.get('content-type')).toContain('text/plain');
		expect(await response.text()).not.toContain('<html');
	}
});

it('preserves server errors and authentication responses without retrying', async () => {
	for (const status of [200, 401, 403, 500]) {
		const response = new Response('server response', { status });
		const fetchMock = vi.fn().mockResolvedValue(response);
		vi.stubGlobal('fetch', fetchMock);
		const request = new Request('https://example.test/map');
		expect(await networkOnlyResponse(request)).toBe(response);
		expect(fetchMock).toHaveBeenCalledExactlyOnceWith(request);
	}
});
