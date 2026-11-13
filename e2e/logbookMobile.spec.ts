import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test.describe('mobile logbook layout (#478)', () => {
	test('renders mobile cards without horizontal scroll and supports sorting', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/logbook');

		// No horizontal overflow on the page or table wrapper
		const pageFits = await page.evaluate(
			() => document.documentElement.scrollWidth <= window.innerWidth
		);
		expect(pageFits).toBe(true);

		const wrapFits = await page.evaluate(() => {
			const wrap = document.querySelector('.table-wrap');
			return wrap ? wrap.scrollWidth <= wrap.clientWidth : false;
		});
		expect(wrapFits).toBe(true);

		// Cards are rendered
		const rows = page.locator('tbody tr');
		expect(await rows.count()).toBeGreaterThan(0);
		const first = rows.first();

		// Mobile card elements are visible
		await expect(first.locator('.route-name')).toBeVisible();
		await expect(first.locator('.mobile-grade')).toBeVisible();
		await expect(first.locator('.mobile-sub')).toBeVisible();

		// Desktop-only cells are hidden on mobile
		await expect(first.locator('.desktop-cell.date')).toBeHidden();
		await expect(first.locator('.desktop-cell.tick-cell')).toBeHidden();

		// Sort pills in thead are visible and interactive
		const thead = page.locator('thead');
		const gradeSort = thead.getByRole('link', { name: /^Grade/ });
		await expect(gradeSort).toBeVisible();
		await gradeSort.click();

		await expect(page).toHaveURL((url) => url.searchParams.get('sort') === 'grade');
		await expect(gradeSort).toHaveClass(/active/);

		// Axe accessibility check on mobile view
		await expectAxeClean(page, { include: ['.table-wrap'] });
	});

	test('renders traditional table on desktop viewport', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/logbook');

		const rows = page.locator('tbody tr');
		expect(await rows.count()).toBeGreaterThan(0);
		const first = rows.first();

		// Desktop-only cells are visible on wide screens
		await expect(first.locator('.desktop-cell.date')).toBeVisible();
		await expect(first.locator('.desktop-cell.tick-cell')).toBeVisible();

		// Mobile-only elements are hidden on desktop
		await expect(first.locator('.mobile-grade')).toBeHidden();
		await expect(first.locator('.mobile-sub')).toBeHidden();
	});
});
