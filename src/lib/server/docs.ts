import { Marked } from 'marked';
import { docPage, type DocSegment, type RenderedDoc } from '#lib/docs';

/** Markdown sources are bundled at build time, so the Docker image needs no docs/ folder. */
const SOURCES = import.meta.glob('/docs/guide/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

const marked = new Marked({
	gfm: true,
	renderer: {
		// External links open in a new tab; in-app links stay client-side.
		link({ href, title, tokens }) {
			const text = this.parser.parseInline(tokens);
			const t = title ? ` title="${title}"` : '';
			return /^https?:\/\//.test(href)
				? `<a href="${href}"${t} target="_blank" rel="noreferrer">${text}</a>`
				: `<a href="${href}"${t}>${text}</a>`;
		}
	}
});

const COMPONENT = /<!--\s*component:([a-z-]+)\s*-->/;

/** Split Markdown on component markers and render the prose parts to HTML. */
export function renderMarkdown(md: string): { title: string; segments: DocSegment[] } {
	const lines = md.replace(/\r\n/g, '\n').split('\n');
	const title = lines[0]?.startsWith('# ') ? lines.shift()!.slice(2).trim() : '';
	const parts = lines.join('\n').split(COMPONENT);
	const segments: DocSegment[] = [];
	parts.forEach((part, i) => {
		if (i % 2 === 1) segments.push({ kind: 'component', name: part });
		else if (part.trim()) segments.push({ kind: 'html', html: marked.parse(part) as string });
	});
	return { title, segments };
}

export function loadDoc(slug: string): RenderedDoc | null {
	if (slug !== 'index' && !docPage(slug)) return null;
	const md = SOURCES[`/docs/guide/${slug}.md`];
	if (md == null) return null;
	return { slug, ...renderMarkdown(md) };
}
