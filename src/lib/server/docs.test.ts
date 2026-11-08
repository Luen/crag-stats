import { describe, expect, it } from 'vitest';
import { renderMarkdown, wrapTables } from './docs';

describe('docs Markdown rendering', () => {
	it('wraps Markdown tables in a focusable scroll region', () => {
		const { segments } = renderMarkdown('# T\n\n| A | B |\n| - | - |\n| 1 | 2 |\n');
		const html = segments.map((s) => (s.kind === 'html' ? s.html : '')).join('');
		expect(html).toMatch(
			/<div class="table-scroll" tabindex="0" role="region" aria-label="Table"><table>[\s\S]*<\/table><\/div>/
		);
	});

	it('leaves table-free HTML untouched', () => {
		expect(wrapTables('<p>No tables here.</p>')).toBe('<p>No tables here.</p>');
	});
});
