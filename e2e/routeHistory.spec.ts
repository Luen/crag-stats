import { expect, test } from '@playwright/test';

// The e2e servers don't set ROUTE_HISTORY_IMPORT, so the import must be off: an explanation,
// no button that would contact theCrag, and the action refuses.
test('route history import is off by default', async ({ page, request }) => {
	await page.goto('/settings');
	await expect(page.getByText('ROUTE_HISTORY_IMPORT=true')).toBeVisible();
	await expect(page.getByRole('button', { name: /Check next/ })).toHaveCount(0);

	const res = await request.post('/settings?/fetchRouteHistory', {
		headers: { origin: new URL(page.url()).origin, accept: 'application/json' },
		form: {}
	});
	expect(await res.text()).toContain('ROUTE_HISTORY_IMPORT=true');
});
