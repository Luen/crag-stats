import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

describe('installed dependency security patches', () => {
	it('minimatch bounds globstar-parent amplification and retains tooling matches', () => {
		const toolingRequire = createRequire(require.resolve('eslint'));
		const entry = toolingRequire.resolve('minimatch');
		const { minimatch, Minimatch } = toolingRequire('minimatch');
		expect(minimatch('src/lib/file.ts', 'src/**/*.ts', { dot: true })).toBe(true);
		expect(new Minimatch('src/**/*.ts', { dot: true }).match('src/lib', true)).toBe(true);
		expect(new Minimatch('**/*.svelte', { dot: true }).match('src/routes/+page.svelte')).toBe(true);
		const result = spawnSync(
			process.execPath,
			[
				'-e',
				`const { Minimatch } = require(process.argv[1]); const m = new Minimatch(Array(30).fill('**/../a/b').join('/'), { optimizationLevel: 2, braceExpandMax: 64 }); if (m.set.length > 64) process.exit(1);`,
				entry
			],
			{ encoding: 'utf8', timeout: 2000 }
		);
		expect(result.error, result.stderr).toBeUndefined();
		expect(result.status, result.stderr).toBe(0);
	});

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
