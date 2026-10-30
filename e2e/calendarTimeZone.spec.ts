import { expect, test } from '@playwright/test';

for (const timezoneId of ['Pacific/Kiritimati', 'America/New_York']) {
	test.describe(`calendar in ${timezoneId}`, () => {
		test.use({ timezoneId });
		test('keeps every logged calendar day in its year after hydration', async ({ page }) => {
			await page.goto('/');
			const card = page
				.locator('article')
				.filter({ has: page.getByRole('heading', { name: 'Ascent calendar', exact: true }) });
			await card.getByRole('button', { name: 'Grade', exact: true }).click();
			const cells = card.locator('a.cell');
			await expect(cells.first()).toHaveAttribute('href', '/logbook?day=2026-01-01');
			await expect(cells.last()).toHaveAttribute('href', '/logbook?day=2026-12-31');
			await expect(cells).toHaveCount(365);
			const days = await cells.evaluateAll((els) => els.map((el) => el.getAttribute('href')));
			expect(new Set(days).size).toBe(365);
			expect(days.every((day) => day?.startsWith('/logbook?day=2026-'))).toBe(true);
		});
	});
}
