import { describe, expect, it } from 'vitest';
import { randomBytes } from 'node:crypto';
import {
	downloadLogbook,
	loginForm,
	parseDownloadedLogbook,
	type LogbookSessionDeps,
	type SavedSession,
	type WebResponse
} from './logbookSession';

const DAY = 86_400_000;
const credentials = { username: 'sample', password: randomBytes(24).toString('hex') };
const form = `<form action="https://www.thecrag.com//CIDS/cgi-bin/cids.cgi" method="post">
<input name="D:Login"><input name="D:Password" type="password">
<input type="hidden" name="D:CSRF" value="fresh&amp;token">
<input type="hidden" name="C:Portal" value="Default Licensee">
<input type="hidden" name="C:ResetContinueURL" value="1"></form>`;
const csv =
	'Route Name,Ascent ID,Route ID,Ascent Date,Ascent Type\nSynthetic route,a1,r1,2026-01-01,Red point\n';
function response(
	status = 200,
	text = csv,
	headers: Record<string, string> = { 'content-type': 'text/csv' }
): WebResponse {
	return { status, text, headers: { get: (name) => headers[name] ?? null } };
}

function harness(responses: WebResponse[]) {
	let now = Date.parse('2026-01-01T00:00:00Z');
	let state: SavedSession = { cookies: [], nextAllowedAt: 0, failures: 0 };
	const calls: { method: string; url: string; data?: string; at: number }[] = [];
	const restored: SavedSession['cookies'][] = [];
	let closed = 0;
	let current = true;
	const deps: LogbookSessionDeps = {
		now: () => now,
		sleep: async (ms) => {
			now += ms;
		},
		stillCurrent: () => current,
		open: async (cookies) => {
			restored.push(cookies);
			return {
				request: async (method, url, data) => {
					calls.push({ method, url, data, at: now });
					const next = responses.shift();
					if (!next) throw new Error('unexpected test request');
					return next;
				},
				cookies: () => [
					{
						name: 'session',
						value: 'synthetic-cookie',
						domain: 'www.thecrag.com',
						path: '/',
						secure: true,
						expires: '2027-01-01T00:00:00.000Z'
					}
				],
				close: async () => {
					closed++;
				}
			};
		}
	};
	const store = {
		load: () => state,
		save: (s: SavedSession) => {
			state = s;
		}
	};
	return {
		deps,
		store,
		calls,
		restored,
		state: () => state,
		closed: () => closed,
		advance: (ms: number) => {
			now += ms;
		},
		cancel: () => {
			current = false;
		}
	};
}

describe('saved-session CSV downloads', () => {
	it.each(['.', '..', 'sample/name', 'sample@example.invalid'])(
		'rejects an invalid account path %s before opening a session',
		async (username) => {
			const h = harness([]);
			await expect(downloadLogbook({ ...credentials, username }, h.store, h.deps)).rejects.toThrow(
				'your username'
			);
			expect(h.restored).toEqual([]);
		}
	);

	it('logs in once with a fresh CSRF token, then reuses the jar in a new client', async () => {
		const h = harness([
			response(404, 'Not found <script src="/cdn-cgi/challenge-platform/h/g/jsd"></script>', {
				'content-type': 'text/html'
			}),
			response(200, form, { 'content-type': 'text/html' }),
			response(302, '', { location: 'cids.cgi?session-transfer=synthetic' }),
			response(302, '', { location: '/climber/sample' }),
			response(200, '<h1>Profile</h1>', { 'content-type': 'text/html' }),
			response(),
			response()
		]);
		expect((await downloadLogbook(credentials, h.store, h.deps)).map((a) => a.externalId)).toEqual([
			'a1'
		]);
		const post = h.calls.find((c) => c.method === 'POST')!;
		const fields = new URLSearchParams(post.data);
		expect(fields.get('D:CSRF')).toBe('fresh&token');
		expect(fields.get('D:Login')).toBe('sample');
		expect(fields.get('D:Password')).toBe(credentials.password);
		expect(fields.get('C:Portal')).toBe('Default Licensee');
		expect(fields.has('State:Login')).toBe(true);
		const before = h.calls.length;
		await downloadLogbook(credentials, h.store, h.deps);
		expect(h.calls.slice(before).map((c) => c.method)).toEqual(['GET']);
		expect(h.restored[1]).toEqual(h.state().cookies);
		expect(h.closed()).toBe(2);
		for (let i = 1; i < before; i++)
			expect(h.calls[i].at - h.calls[i - 1].at).toBeGreaterThanOrEqual(1100);
	});

	it('re-authenticates an expired session only once and does not save failed login cookies', async () => {
		const h = harness([
			response(401),
			response(200, form, { 'content-type': 'text/html' }),
			response(200, form, { 'content-type': 'text/html' })
		]);
		h.store.save({
			cookies: [{ name: 'session', value: 'expired' }],
			nextAllowedAt: 0,
			failures: 0
		});
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow('login failed');
		expect(h.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
		expect(h.state().cookies[0].value).toBe('expired');
		const before = h.calls.length;
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow('paused');
		expect(h.calls).toHaveLength(before);
		expect(h.state().nextAllowedAt - h.deps.now()).toBeGreaterThanOrEqual(DAY);
	});

	it.each([403, 429, 503])(
		'stops on %i without logging in and persists Retry-After back-off',
		async (status) => {
			const h = harness([
				response(status, 'private upstream body', { 'retry-after': String((3 * DAY) / 1000) })
			]);
			await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow(
				'blocked or throttled'
			);
			expect(h.calls).toHaveLength(1);
			expect(h.state().nextAllowedAt - h.deps.now()).toBe(3 * DAY);
			expect(h.closed()).toBe(1);
		}
	);

	it('stops on a 200 challenge page without attempting login', async () => {
		const h = harness([
			response(200, '<title>Just a moment...</title>', { 'content-type': 'text/html' })
		]);
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow(
			'blocked or throttled'
		);
		expect(h.calls).toHaveLength(1);
	});

	it.each([
		'https://other.invalid/login',
		'http://www.thecrag.com/login',
		'https://www.thecrag.com@other.invalid/'
	])('refuses an unsafe redirect to %s', async (location) => {
		const h = harness([response(302, '', { location })]);
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow(
			'outside its HTTPS origin'
		);
		expect(h.calls).toHaveLength(1);
	});

	it('never resends login credentials on a 307 redirect', async () => {
		const h = harness([
			response(401),
			response(200, form, { 'content-type': 'text/html' }),
			response(307, '', { location: '/' })
		]);
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow(
			'not safe to follow'
		);
		expect(h.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
	});

	it('does not expose raw native errors with credentials, cookies or private response data', async () => {
		const h = harness([]);
		h.deps.open = async () => {
			throw new Error('secret-password; Cookie: private-session; private-note');
		};
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow(
			'theCrag logbook download failed (network or impers unavailable).'
		);
	});

	it('does not save data or login state after a wipe during a request', async () => {
		const h = harness([]);
		const open = h.deps.open;
		h.deps.open = async (cookies) => ({
			...(await open(cookies)),
			request: async () => {
				h.cancel();
				return response();
			}
		});
		await expect(downloadLogbook(credentials, h.store, h.deps)).rejects.toThrow('cancelled');
		expect(h.state()).toEqual({ cookies: [], nextAllowedAt: 0, failures: 0 });
	});

	it('fails closed when login controls change or CSRF is missing', () => {
		expect(() => loginForm(form.replace('D:CSRF', 'missing'))).toThrow('no CSRF');
		expect(() => loginForm(form.replace('www.thecrag.com', 'other.invalid'))).toThrow(
			'outside its HTTPS origin'
		);
	});

	it('accepts a single-slash CIDS login action path', () => {
		const single = form.replace('//CIDS/cgi-bin/cids.cgi', '/CIDS/cgi-bin/cids.cgi');
		expect(loginForm(single).action).toBe('https://www.thecrag.com/CIDS/cgi-bin/cids.cgi');
	});

	it.each([
		response(200, '<html>login page</html>', { 'content-type': 'text/html' }),
		response(206),
		response(200, 'name,id\nx,1\n'),
		response(200, csv + 'broken,row\n'),
		response(200, csv + 'Missing ID,,r2,2026-01-02,Red point\n'),
		response(200, csv + 'Duplicate,a1,r2,2026-01-02,Red point\n')
	])('rejects invalid or partial exports before ingestion %#', (r) => {
		expect(() => parseDownloadedLogbook(r)).toThrow();
	});
});
