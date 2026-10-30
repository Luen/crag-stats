import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('cookie preferences render correctly with JavaScript disabled', async ({
	browser,
	baseURL
}) => {
	const context = await browser.newContext({ javaScriptEnabled: false, baseURL });
	try {
		await context.addCookies(
			Object.entries({
				cs_partners_metric: 'sessions',
				cs_weekday_metric: 'ascents',
				cs_weekday_range: 'last12',
				cs_weekday_style: 'trad',
				cs_yearly_chart: 'cumulative',
				cs_heatmap_mode: 'grade'
			}).map(([name, value]) => ({ name, value, url: baseURL! }))
		);
		const page = await context.newPage();
		await page.goto('/partners');
		await expect(page.getByRole('button', { name: 'Sessions', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('button', { name: 'Sessions', exact: true })).toBeVisible();
		await page.goto('/');
		const weekday = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Weekday', exact: true }) });
		await expect(weekday.getByRole('button', { name: 'Ascents', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(weekday.getByRole('button', { name: 'Trad', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('button', { name: 'Cumulative', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await context.clearCookies();
		await page.reload();
		await expect(weekday).toBeVisible();
	} finally {
		await context.close();
	}
});

for (const colorScheme of ['light', 'dark'] as const)
	test(`legacy preferences migrate without visible defaults in ${colorScheme}`, async ({
		page,
		context
	}) => {
		await page.emulateMedia({ colorScheme });
		await page.addInitScript(() => {
			localStorage.setItem('cs_partners_metric', 'areas');
			localStorage.setItem('cs_yearly_chart', 'career');
		});
		await page.goto('/partners');
		await expect(page.getByRole('button', { name: 'Areas', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		expect((await context.cookies()).find((c) => c.name === 'cs_partners_metric')?.value).toBe(
			'areas'
		);
		await page.reload();
		await expect(page.getByRole('button', { name: 'Areas', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		const axe = await new AxeBuilder({ page }).analyze();
		expect(axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')).toEqual(
			[]
		);
		await page.goto('/activity');
		await expect(page.getByRole('button', { name: 'Cumulative', exact: true })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
	});

test('blocked localStorage falls back to usable defaults', async ({ page }) => {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'localStorage', {
			get() {
				throw new Error('blocked');
			}
		});
	});
	await page.goto('/partners');
	await expect(page.getByRole('button', { name: 'Ascents', exact: true })).toBeVisible();
	await page.getByRole('button', { name: 'Sessions', exact: true }).click();
	await page.reload();
	await expect(page.getByRole('button', { name: 'Sessions', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);
});
