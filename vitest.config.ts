import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			'#lib': path.join(root, 'src/lib'),
			'#lib/': path.join(root, 'src/lib/')
		}
	},
	test: {
		name: 'crag-stats',
		environment: 'node',
		include: ['src/**/*.{test,spec}.ts'],
		// Each test file gets its own in-memory SQLite (#lib/server/db opens DATABASE_PATH on
		// import). Parallel workers sharing one WAL file failed with "disk I/O error" (#57).
		env: { DATABASE_PATH: ':memory:' },
		reporters: ['default']
	}
});
