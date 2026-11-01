import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Automated accessibility check (#43): no serious/critical axe violations in either theme.
for (const scheme of ['light', 'dark'] as const) {
	test.describe(`${scheme} theme`, () => {
		test.use({ colorScheme: scheme });

		test('axe: mobile Settings including the shared header', async ({ page }) => {
			await page.setViewportSize({ width: 390, height: 844 });
			await page.goto('/settings');
			const results = await new AxeBuilder({ page }).analyze();
			const serious = results.violations.filter(
				(v) => v.impact === 'serious' || v.impact === 'critical'
			);
			expect(serious.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
			await expect(page.getByRole('link', { name: 'Crag Stats', exact: true })).toBeVisible();
			expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
				true
			);
		});
		for (const path of [
			'/',
			'/logbook',
			'/settings',
			'/docs/grades',
			'/docs/training-load',
			'/training-load',
			'/badges'
		]) {
			test(`axe: ${path}`, async ({ page }) => {
				await page.goto(path);
				const results = await new AxeBuilder({ page }).analyze();
				const serious = results.violations.filter(
					(v) => v.impact === 'serious' || v.impact === 'critical'
				);
				const summary = serious.flatMap((v) => [
					`${v.id}: ${v.help} (${v.nodes.length})`,
					...v.nodes
						.slice(0, 8)
						.map((n) => `  ${n.target.join(' ')} — ${n.any[0]?.message ?? n.failureSummary ?? ''}`)
				]);
				expect(summary, summary.join('\n')).toEqual([]);
			});
		}
	});
}
