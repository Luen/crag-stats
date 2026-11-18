import { describe, expect, it } from 'vitest';
import { loadDoc, renderMarkdown, wrapTables } from './docs';

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

	it('localises the accessible name of rendered Markdown tables', () => {
		const { segments } = renderMarkdown('# Tabelle\n\n| A | B |\n| - | - |\n| 1 | 2 |\n', 'de');
		expect(segments.some((s) => s.kind === 'html' && s.html.includes('aria-label="Tabelle"'))).toBe(
			true
		);
	});

	it('loads English documentation by default', () => {
		const doc = loadDoc('climber-type');
		expect(doc).not.toBeNull();
		expect(doc?.title).toBe('Climber type');
		expect(doc?.slug).toBe('climber-type');
	});

	it('loads localized documentation when available', () => {
		const doc = loadDoc('climber-type', 'de');
		expect(doc).not.toBeNull();
		expect(doc?.title).toBe('Klettertyp');
		expect(doc?.slug).toBe('climber-type');
	});

	it('falls back to English when a localized guide is not yet translated', () => {
		const doc = loadDoc('training-load', 'de');
		expect(doc).not.toBeNull();
		expect(doc?.title).toBe('Training load');
	});

	it('returns null for unknown slugs', () => {
		expect(loadDoc('non-existent-slug')).toBeNull();
		expect(loadDoc('non-existent-slug', 'de')).toBeNull();
	});
});
