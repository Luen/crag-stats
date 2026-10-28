import { describe, expect, it } from 'vitest';
import {
	parseStoredRouteBeta,
	plainTextFromMarkdown,
	projectPublicBetaFromJson,
	truncatePlain
} from './routeBeta';

describe('parseStoredRouteBeta', () => {
	it('ignores invalid JSON and private fields', () => {
		expect(parseStoredRouteBeta(null)).toBeNull();
		const beta = parseStoredRouteBeta(
			JSON.stringify({ description: 'Line.', comment: 'secret' })
		);
		expect(beta?.description).toBe('Line.');
		expect(beta && 'comment' in beta).toBe(false);
	});
});

describe('plainTextFromMarkdown', () => {
	it('strips common markdown', () => {
		expect(plainTextFromMarkdown('**Bold** and [link](https://x.test)')).toBe('Bold and link');
	});
});

describe('projectPublicBetaFromJson', () => {
	it('builds card fields with short excerpts', () => {
		const long = 'word '.repeat(80).trim();
		const json = JSON.stringify({
			description: `**Start** ${long}`,
			accessIssues: 'Closed when wet.',
			attributionUrl: 'https://www.thecrag.com/en/climbing/qld/route/9'
		});
		const card = projectPublicBetaFromJson(json)!;
		expect(card.accessWarning).toContain('Closed when wet');
		expect(card.descriptionExcerpt!.endsWith('…')).toBe(true);
	});

	it('returns null when nothing to show', () => {
		expect(projectPublicBetaFromJson('{}')).toBeNull();
	});
});

describe('truncatePlain', () => {
	it('adds ellipsis when over max', () => {
		expect(truncatePlain('one two three four five', 10)).toBe('one two…');
	});
});
