import Database from 'better-sqlite3';
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

		// Crag keeps its in-app filter link
		await expect(first.locator('.mobile-sub a[href^="/logbook?crag="]')).toBeVisible();

		// Owner actions stay reachable inside the card
		await expect(first.locator('.fa-edit')).toBeVisible();
		await expect(first.locator('.project-selection')).toBeVisible();

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

	test('keeps the table scrollable instead of clipped on narrow desktops', async ({ page }) => {
		// The sidebar leaves too little room for all 11 columns at this width, so the
		// wrapper must still scroll rather than cutting columns off (#478 review).
		await page.setViewportSize({ width: 900, height: 900 });
		await page.goto('/logbook');

		const box = await page.evaluate(() => {
			const wrap = document.querySelector('.table-wrap');
			if (!wrap) return null;
			return {
				overflowX: getComputedStyle(wrap).overflowX,
				scrolls: wrap.scrollWidth > wrap.clientWidth
			};
		});
		expect(box).not.toBeNull();
		expect(box!.overflowX).toBe('auto');
		expect(box!.scrolls).toBe(true);

		// Table mode stays on: no stacked cards above the mobile breakpoint.
		await expect(page.locator('tbody tr').first().locator('.mobile-sub')).toBeHidden();
	});

	test('mobile cards keep the external crag link', async ({ page }) => {
		// The sample CSV has no crag URLs, so seed one the way an API sync would.
		const db = new Database('e2e/.tmp/open.sqlite');
		try {
			db.prepare(
				`UPDATE routes SET crag_url = 'https://www.thecrag.com/en/climbing/australia/example/area/2'`
			).run();
			await page.setViewportSize({ width: 390, height: 844 });
			await page.goto('/logbook');

			const ext = page.locator('tbody tr').first().locator('.mobile-sub a.ext');
			await expect(ext).toBeVisible();
			await expect(ext).toHaveAttribute('href', /^https:\/\/www\.thecrag\.com\//);
			await expect(ext).toHaveAttribute('aria-label', /on theCrag$/);
		} finally {
			db.prepare('UPDATE routes SET crag_url = NULL').run();
			db.close();
		}
	});
});
