import { expect, test } from '@playwright/test';
import { PORTS, TEST_PASSWORD } from '../playwright.config';

const settingsOrigin = `http://localhost:${PORTS.settings}`;
const allOrigin = `http://localhost:${PORTS.all}`;

test.describe('AUTH_SCOPE=settings', () => {
	test('settings redirects to login; dashboard is public but not customisable', async ({
		page
	}) => {
		await page.goto(`${settingsOrigin}/settings`);
		await expect(page).toHaveURL(/\/login\?next=%2Fsettings/);
		await page.goto(`${settingsOrigin}/`);
		await expect(page.getByText('Customize dashboard')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Log out' })).toHaveCount(0);
	});

	test('login shows the header log-out button, which signs out', async ({ page }) => {
		await page.goto(`${settingsOrigin}/login?next=/settings`);
		await page.getByPlaceholder('Password').fill(TEST_PASSWORD);
		await page.getByRole('button', { name: 'Unlock' }).click();
		await expect(page).toHaveURL(`${settingsOrigin}/settings`);
		await page.locator('header').getByRole('button', { name: 'Log out' }).click();
		await expect(page).toHaveURL(/\/login/);
		await page.goto(`${settingsOrigin}/settings`);
		await expect(page).toHaveURL(/\/login/);
	});
});

test.describe('AUTH_SCOPE=all', () => {
	test('everything is gated and search engines are always blocked', async ({ page, request }) => {
		await page.goto(`${allOrigin}/`);
		await expect(page).toHaveURL(/\/login/);
		await expect(page.locator('meta[property="og:title"]')).toHaveCount(0);
		const robots = await request.get(`${allOrigin}/robots.txt`);
		expect(await robots.text()).toBe('User-agent: *\nDisallow: /\n');
		expect(robots.headers()['x-robots-tag']).toBe('noindex, nofollow');
	});
});
