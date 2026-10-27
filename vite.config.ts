import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build' }),
			// Content-Security-Policy (#40). `auto` = per-request nonces for SSR pages; the
			// pre-paint theme script in app.html carries %sveltekit.nonce%.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					// Svelte `style:` directives + transitions use inline styles.
					'style-src': ['self', 'unsafe-inline'],
					// theCrag avatars / route images + inline data: SVG.
					'img-src': ['self', 'data:', 'https:'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['self'],
					'frame-ancestors': ['none']
				}
			}
		})
	],
	server: {
		fs: {
			allow: ['..']
		}
	},
	ssr: {
		external: ['better-sqlite3']
	},
	optimizeDeps: {
		exclude: ['better-sqlite3']
	}
});
