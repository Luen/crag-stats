import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DOC_PAGES, TICK_DOCS } from './docs';
import { classifyTick } from './server/providers/types';

describe('docs', () => {
	it('tick-type docs agree with how ticks are classified', () => {
		for (const group of TICK_DOCS) {
			for (const t of group.ticks) {
				expect(classifyTick(t.name).isSend, `${group.group}: ${t.name}`).toBe(t.send);
			}
		}
	});

	it('every manifest page has a Markdown file with a matching H1', () => {
		for (const page of DOC_PAGES) {
			const md = readFileSync(
				join(__dirname, '..', '..', 'docs', 'guide', `${page.slug}.md`),
				'utf8'
			);
			expect(md.split('\n')[0], page.slug).toBe(
				`# ${page.title === 'CPR' ? 'CPR (Climber Performance Rating)' : page.title}`
			);
		}
	});
});
