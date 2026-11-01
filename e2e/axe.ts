import AxeBuilder from '@axe-core/playwright';
import { expect, type Locator, type Page } from '@playwright/test';

export const THEMES = ['light', 'dark'] as const;
type Theme = (typeof THEMES)[number];

/**
 * Fails on serious/critical axe violations at the page's current state, in each theme.
 *
 * Feature flows are theme-independent, so they run once and call this at each state worth
 * auditing. The theme switches in place via prefers-color-scheme (no reload), so UI state such
 * as open details or pressed toggles is scanned as-is. Transitions are disabled first so axe
 * never samples colours mid-fade (#167). Leaves the page on the first theme.
 *
 * Scope `include` to the region the feature changed (a CSS selector or a Locator, such as one
 * dashboard card). `a11y.spec.ts` already audits the shared header, sidebar and full pages in both
 * themes, and full-page scans are the slowest e2e step. Scan the whole page only when the
 * regression lives in shared chrome.
 */
export async function expectAxeClean(
	page: Page,
	{
		include = [],
		themes = THEMES
	}: { include?: (string | Locator)[]; themes?: readonly Theme[] } = {}
) {
	await page.addStyleTag({
		content: '*,*::before,*::after{transition:none!important;animation:none!important}'
	});
	const selectors: string[] = [];
	for (const [i, target] of include.entries()) {
		if (typeof target === 'string') {
			selectors.push(target);
			continue;
		}
		// axe only takes CSS selectors, so mark each matched element with a scan-scoped attribute.
		const attr = `data-axe-scope-${i}`;
		await expect(target.first()).toBeAttached();
		await target.evaluateAll((els, a) => els.forEach((el) => el.setAttribute(a, '')), attr);
		selectors.push(`[${attr}]`);
	}
	for (const colorScheme of themes) {
		await page.emulateMedia({ colorScheme });
		let builder = new AxeBuilder({ page });
		for (const selector of selectors) builder = builder.include(selector);
		const { violations } = await builder.analyze();
		const summary = violations
			.filter((v) => v.impact === 'serious' || v.impact === 'critical')
			.flatMap((v) => [
				`${v.id}: ${v.help} (${v.nodes.length})`,
				...v.nodes
					.slice(0, 8)
					.map((n) => `  ${n.target.join(' ')} — ${n.any[0]?.message ?? n.failureSummary ?? ''}`)
			]);
		expect(summary, `${colorScheme} theme:\n${summary.join('\n')}`).toEqual([]);
	}
	await page.emulateMedia({ colorScheme: themes[0] });
	await page.evaluate(() =>
		document.querySelectorAll('*').forEach((el) => {
			for (const { name } of [...el.attributes])
				if (name.startsWith('data-axe-scope-')) el.removeAttribute(name);
		})
	);
}
