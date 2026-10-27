import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- plain JS module shared with scripts/server.mjs (no .d.ts)
import { resolveForwarding } from '../../../scripts/serverOrigin.mjs';

type Headers = Record<string, string | string[] | undefined>;

describe('resolveForwarding (#47)', () => {
	it('fills in http for direct plain-HTTP requests', () => {
		const f = resolveForwarding({});
		expect(f.protocolHeader).toBe('x-forwarded-proto');
		const h: Headers = { host: '192.168.1.10:8097' };
		f.apply(h, false);
		expect(h['x-forwarded-proto']).toBe('http');
	});

	it("keeps a proxy's X-Forwarded-Proto", () => {
		const f = resolveForwarding({});
		const h: Headers = { 'x-forwarded-proto': 'https' };
		f.apply(h, false);
		expect(h['x-forwarded-proto']).toBe('https');
	});

	it('respects a custom PROTOCOL_HEADER name', () => {
		const f = resolveForwarding({ PROTOCOL_HEADER: 'X-Scheme' });
		const h: Headers = {};
		f.apply(h, false);
		expect(h['x-scheme']).toBe('http');
	});

	it('ORIGIN pins protocol and host, overriding anything the client sent', () => {
		const f = resolveForwarding({ ORIGIN: 'https://crag.example.com' });
		expect(f.hostHeader).toBe('x-crag-stats-host');
		const h: Headers = { 'x-forwarded-proto': 'http', 'x-crag-stats-host': 'evil.example' };
		f.apply(h, false);
		expect(h['x-forwarded-proto']).toBe('https');
		expect(h['x-crag-stats-host']).toBe('crag.example.com');
	});

	it('ignores an invalid ORIGIN', () => {
		const f = resolveForwarding({ ORIGIN: 'not a url' });
		expect(f.origin).toBeNull();
		expect(f.hostHeader).toBeNull();
	});
});
