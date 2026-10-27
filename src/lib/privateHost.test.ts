import { describe, expect, it } from 'vitest';
import { isPrivateHost } from './privateHost';

describe('isPrivateHost', () => {
	it('flags loopback, LAN names and private ranges', () => {
		for (const h of [
			'localhost',
			'app.localhost',
			'127.0.0.1',
			'10.0.0.5',
			'172.16.0.1',
			'172.31.255.255',
			'192.168.1.20',
			'169.254.10.1',
			'100.101.102.103',
			'nas.local',
			'crag.lan',
			'homeserver',
			'[::1]',
			'fd12:3456::1',
			'fe80::1',
			'::ffff:192.168.0.2'
		]) {
			expect(isPrivateHost(h), h).toBe(true);
		}
	});

	it('passes public names and addresses', () => {
		for (const h of [
			'crag.luenwarneke.com',
			'example.org',
			'8.8.8.8',
			'172.32.0.1',
			'172.15.0.1',
			'100.128.0.1',
			'2606:4700::1111'
		]) {
			expect(isPrivateHost(h), h).toBe(false);
		}
	});
});
