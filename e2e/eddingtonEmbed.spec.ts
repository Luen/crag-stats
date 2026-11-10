import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';

test('Eddington embed keeps numeric indexes and converts only explanatory grades', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const keys = ['route_grade_system', 'boulder_grade_system'];
	const saved = db
		.prepare(`SELECT key,value,updated_at FROM app_settings WHERE key IN (?,?)`)
		.all(...keys) as { key: string; value: string; updated_at: string }[];
	const preferences = (route: string, boulder: string) => {
		for (const [key, value] of [
			[keys[0], route],
			[keys[1], boulder]
		])
			db.prepare(
				`INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,'2026-11-10') ON CONFLICT(key) DO UPDATE SET value=excluded.value`
			).run(key, value);
	};
	const indexes = async () => {
		const text = await page.locator('svg text').allTextContents();
		return ['route grade index', 'boulder grade index'].map(
			(label) => text[text.indexOf(label) - 1]
		);
	};
	try {
		preferences('ewbank', 'v_scale');
		await page.goto('/embed/eddington.svg');
		const original = await indexes();
		expect(original.every((value) => /^\d+$/.test(value))).toBe(true);
		await expect(page.locator('svg')).toContainText(/problems sent at V\d+ or harder/);
		preferences('french', 'font');
		for (const theme of ['light', 'dark']) {
			await page.goto(`/embed/eddington.svg?theme=${theme}`);
			expect(await indexes()).toEqual(original);
			await expect(page.locator('svg')).toContainText('routes sent at French');
			await expect(page.locator('svg')).toContainText('problems sent at Font');
			await expect(page.locator('svg')).toContainText('more problems at ≥ Font');
			const clipped = await page.locator('svg text').evaluateAll((nodes) =>
				nodes
					.filter((node) => {
						const box = (node as SVGTextElement).getBBox();
						return box.x < 0 || box.y < 0 || box.x + box.width > 480 || box.y + box.height > 320;
					})
					.map((node) => node.textContent)
			);
			expect(clipped).toEqual([]);
			await page.locator('svg').screenshot({ path: `e2e/.tmp/eddington-embed-${theme}.png` });
		}
		await page.goto('/embed/eddington.svg?system=yds&boulderSystem=v_scale');
		expect(await indexes()).toEqual(original);
		await expect(page.locator('svg')).toContainText('routes sent at YDS');
		await expect(page.locator('svg')).toContainText(/problems sent at V\d+ or harder/);
	} finally {
		db.prepare('DELETE FROM app_settings WHERE key IN (?,?)').run(...keys);
		for (const row of saved)
			db.prepare('INSERT INTO app_settings(key,value,updated_at) VALUES(?,?,?)').run(
				row.key,
				row.value,
				row.updated_at
			);
		db.close();
	}
});
