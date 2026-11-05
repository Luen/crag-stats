import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('weather empty state is discoverable and respects app authentication', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/weather?group=invalid&measure=invalid');
	await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible();
	await expect(
		page.getByRole('heading', { name: 'No weather cached for outdoor climbs yet' })
	).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Coverage & location quality' })).toBeVisible();
	await expectAxeClean(page, { include: ['main'] });
	// Settings-only auth keeps weather public but management links owner-only.
	await page.goto('http://localhost:4302/weather');
	await expect(page.getByRole('heading', { name: 'Weather', exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Review weather locations' })).toHaveCount(0);
	await expect(page.getByRole('link', { name: 'Manage weather imports' })).toHaveCount(0);
	await page.goto('http://localhost:4303/weather');
	await expect(page).toHaveURL(/\/login/);
});
