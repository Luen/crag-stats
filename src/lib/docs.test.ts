import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { docPage, docPages, DOC_PAGES, getBandDocText, getTickDocs, TICK_DOCS } from './docs';
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

	it('returns localized doc pages for German', () => {
		const pages = docPages('de');
		expect(pages.length).toBe(DOC_PAGES.length);
		const climberType = pages.find((p) => p.slug === 'climber-type');
		expect(climberType?.title).toBe('Klettertyp');
		expect(climberType?.summary).toContain('Übersicht');

		const cpr = docPage('cpr', 'de');
		expect(cpr?.title).toBe('CPR');
		expect(cpr?.summary).toContain('theCrags');
	});

	it('returns localized band descriptions for German', () => {
		expect(getBandDocText(1, 'de')).toContain('Klettertage');
		expect(getBandDocText(1, 'en')).toContain('first days of climbing');
	});

	it('returns localized tick documentation for German', () => {
		const groups = getTickDocs('de');
		expect(groups.length).toBe(TICK_DOCS.length);
		const lead = groups.find((g) => g.group === 'Vorstieg');
		expect(lead).toBeDefined();
		expect(lead?.styles).toContain('Sportklettern');
		const redpoint = lead?.ticks.find((t) => t.name === 'Rotpunkt');
		expect(redpoint).toBeDefined();
		expect(redpoint?.send).toBe(true);
		expect(redpoint?.meaning).toContain('Vorstieg');
	});
});
