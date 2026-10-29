import { gzipSync } from 'node:zlib';
import { beforeEach, expect, it, vi } from 'vitest';
import { openLogbookSession } from './logbookSession';
import type { SessionOptions, RequestOptions } from 'impers';

const native = vi.hoisted(() => ({
	options: undefined as SessionOptions | undefined,
	request: vi.fn(),
	close: vi.fn(),
	cookies: [] as { name: string; value: string; domain?: string; expires?: Date }[]
}));
vi.mock('impers', () => ({
	Session: class {
		constructor(options: SessionOptions) {
			native.options = options;
		}
		request = native.request;
		close = native.close;
		get cookies() {
			return native.cookies;
		}
	}
}));
beforeEach(() => {
	vi.clearAllMocks();
	native.cookies = [];
});

it('restores cookie attributes, bounds redirects, decodes compressed exports and closes the native client', async () => {
	const cookie = {
		name: 'session',
		value: 'synthetic-cookie',
		domain: '.thecrag.com',
		path: '/climber',
		secure: true,
		httpOnly: true,
		sameSite: 'Lax' as const,
		expires: '2027-01-01T00:00:00.000Z'
	};
	const client = await openLogbookSession([cookie]);
	expect(native.options).toMatchObject({
		allowRedirects: false,
		timeout: 45,
		cookies: [{ ...cookie, expires: new Date(cookie.expires) }]
	});
	native.request.mockImplementation(
		async (_method: string, _url: string, options: RequestOptions) => {
			options.contentCallback!(gzipSync('synthetic,csv\n'));
			return { status: 200, headers: new Headers({ 'content-encoding': 'gzip' }) };
		}
	);
	expect(
		(await client.request('GET', 'https://www.thecrag.com/climber/sample/logbook-csv')).text
	).toBe('synthetic,csv\n');
	expect(native.request.mock.calls[0][2]).toMatchObject({
		stream: true,
		acceptEncoding: 'identity'
	});
	native.cookies = [
		{ ...cookie, expires: new Date(cookie.expires) },
		{ name: 'other', value: 'synthetic', domain: 'other.invalid' }
	];
	expect(client.cookies()).toEqual([cookie]);
	await client.close();
	expect(native.close).toHaveBeenCalledOnce();
});

it('rejects an oversized stream even when the native request resolves after abort', async () => {
	const client = await openLogbookSession([]);
	native.request.mockImplementation(
		async (_method: string, _url: string, options: RequestOptions) => {
			options.contentCallback!(
				Buffer.from('Route Name,Ascent ID,Route ID,Ascent Date,Ascent Type\n')
			);
			options.contentCallback!(Buffer.alloc(64 * 1024 * 1024));
			expect(options.signal!.aborted).toBe(true);
			return { status: 200, headers: new Headers({ 'content-type': 'text/csv' }) };
		}
	);
	await expect(
		client.request('GET', 'https://www.thecrag.com/climber/sample/logbook-csv')
	).rejects.toThrow('exceeded size limit');
});

it('rejects foreign URLs before handing them to the native client', async () => {
	const client = await openLogbookSession([]);
	await expect(client.request('GET', 'https://other.invalid/')).rejects.toThrow(
		'outside its HTTPS origin'
	);
	expect(native.request).not.toHaveBeenCalled();
});
