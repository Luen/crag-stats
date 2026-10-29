import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('installed dependency security patches', () => {
	it.each(['deepmerge', 'deepmerge/dist/umd.js'])(
		'%s rejects prototype keys in both merge inputs',
		(entry) => {
			const merge = require(entry);
			const payload = JSON.parse('{"__proto__":{"elevated":true},"valid":1}');
			for (const result of [
				merge(Object.create(null), payload),
				merge(payload, { other: 2 }),
				merge({ nested: null }, { nested: payload }).nested,
				merge({ list: [] }, { list: [payload] }).list[0]
			]) {
				expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
				expect(result.elevated).toBeUndefined();
				expect(result.valid).toBe(1);
			}
		}
	);

	it('picomatch preserves ordinary globs and literalizes unsafe repeated wildcards', () => {
		const match = require('picomatch');
		expect(match('src/**/*.ts')('src/lib/file.ts')).toBe(true);
		expect(match('+(abc)')('abcabc')).toBe(true);
		expect(match('+(a|b)')('abba')).toBe(true);
		for (const pattern of ['+(*)x', '+(*a)b', '*(*a)b', '+(@(*a))b']) {
			const result = spawnSync(
				process.execPath,
				[
					'-e',
					`const m = require(process.argv[1]); if (m(process.argv[2])('a'.repeat(256) + '!')) process.exit(1);`,
					require.resolve('picomatch'),
					pattern
				],
				{ encoding: 'utf8', timeout: 2000 }
			);
			expect(result.error, result.stderr).toBeUndefined();
			expect(result.status, result.stderr).toBe(0);
			expect(match(pattern)(pattern)).toBe(true);
		}
	}, 15000);

	it.each(['uri-js', 'uri-js/dist/es5/uri.all.min.js'])(
		'%s rejects invalid UTF-8 and handles malformed mailto',
		(entry) => {
			const uri = require(entry);
			for (const encoded of ['%E0%80%AE', '%E0%80%AF', '%E0%80%8D', '%ED%A0%80', '%F4%90%80%80'])
				expect(uri.pctDecChars(encoded)).toBe(encoded);
			expect(uri.pctDecChars('%E2%82%AC')).toBe('€');
			expect(uri.pctDecChars('%F0%9F%98%80')).toBe('😀');
			expect(() => uri.parse('mailto:?to')).not.toThrow();
			expect(uri.resolve('https://example.com/a/b', '../c')).toBe('https://example.com/c');
		}
	);

	it('URI dot-segment removal advances over Unicode separators', () => {
		const result = spawnSync(
			process.execPath,
			[
				'-e',
				`const u = require(process.argv[1]); for (const s of ['\\u2028', '\\u2029']) { if (u.removeDotSegments('/a/' + s + '/b/../c') !== '/a/' + s + '/c') process.exit(1); }`,
				require.resolve('uri-js')
			],
			{ encoding: 'utf8', timeout: 2000 }
		);
		expect(result.error, result.stderr).toBeUndefined();
		expect(result.status, result.stderr).toBe(0);
	});
});
