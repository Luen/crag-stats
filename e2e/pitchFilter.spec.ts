import { expect, test } from '@playwright/test';

test('the pitches alias stays selected when applying a different sort', async ({ page }) => {
	await page.goto('/logbook?missing=pitches');
	await expect(page.getByRole('checkbox', { name: 'No pitch list cached' })).toBeChecked();
	await page.getByLabel('Sort by', { exact: true }).selectOption('grade');
	await page.getByRole('button', { name: 'Apply filters' }).click();
	await expect(page).toHaveURL(/[?&]sort=grade(?:&|$)/);
	const params = new URL(page.url()).searchParams;
	expect(params.getAll('missing')).toContain('pitch');
	expect(params.get('sort')).toBe('grade');
	await expect(page.getByRole('checkbox', { name: 'No pitch list cached' })).toBeChecked();
});
