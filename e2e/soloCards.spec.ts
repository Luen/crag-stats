import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const colorScheme of ['light', 'dark'] as const) {
	test(`solo cards open matching logbook ascents in ${colorScheme}`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		const db = new Database('e2e/.tmp/open.sqlite');
		const ids: number[] = [];
		try {
			const fixtures = [
				['toprope', 'Roped_Solo', 'Sport', 'Top-rope solo'],
				['lead', 'leadsolo', 'Sport', 'Lead solo'],
				['free', 'Onsight', 'solo', 'Free solo'],
				['dws', 'Red point', 'dws', 'Deep water solo'],
				['aid', 'Aid solo', 'Sport', 'Aid solo']
			];
			for (const [kind, tick, style] of fixtures) {
				const id = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,gear_style,grade_raw,grade_score,grade_band,updated_at) VALUES ('thecrag',?,?,'Sport','19',19,3,'2026-10-31')`
						)
						.run(`solo-card-${kind}`, `Synthetic ${kind} solo`).lastInsertRowid
				);
				ids.push(id);
				const count = kind === 'lead' ? 52 : 1;
				for (let i = 0; i < count; i++)
					db.prepare(
						`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,ascent_gear_style,is_send,ascent_url,updated_at) VALUES ('thecrag',?,?,'2026-01-01',?,?,1,'https://www.thecrag.com/ascent/12345','2026-10-31')`
					).run(`solo-card-${kind}-${i}`, id, tick, style);
			}
			for (const [kind, , , label] of fixtures) {
				await page.goto('/');
				const card = page
					.locator('article')
					.filter({ has: page.getByRole('heading', { name: 'Solo climbing', exact: true }) });
				const link = card.getByRole('link', {
					name: `View ${label} climbs in the logbook`,
					exact: true
				});
				await expect(link).toHaveAttribute('href', `/logbook?solo=${kind}`);
				const tile = link.locator('..').locator('..');
				await expect(
					tile.getByRole('link', { name: `Synthetic ${kind} solo`, exact: true })
				).toHaveAttribute('href', 'https://www.thecrag.com/ascent/12345');
				await link.focus();
				if (kind === 'lead') {
					await page.keyboard.press('Enter');
				} else {
					// Click the tile's bottom-right padding to exercise the stretched hit area.
					const box = await tile.boundingBox();
					await page.mouse.click(box!.x + box!.width - 8, box!.y + box!.height - 8);
				}
				await expect(page).toHaveURL(new RegExp(`/logbook\\?solo=${kind}$`));
				await expect(page.getByRole('combobox', { name: 'Solo type', exact: true })).toHaveValue(
					kind
				);
				await expect(page.locator('tbody')).toContainText(`Synthetic ${kind} solo`);
				if (kind === 'lead') {
					await page.getByRole('link', { name: 'Next →', exact: true }).click();
					await expect(page).toHaveURL(/solo=lead.*page=2/);
					await page
						.getByRole('link', { name: /^Grade/ })
						.first()
						.click();
					await expect(page).toHaveURL(/solo=lead/);
					await page.getByRole('button', { name: /Filter|Apply/ }).click();
					await expect(page.getByRole('combobox', { name: 'Solo type', exact: true })).toHaveValue(
						'lead'
					);
				}
			}
			await page.goto('/');
			const card = page
				.locator('article')
				.filter({ has: page.getByRole('heading', { name: 'Solo climbing', exact: true }) });
			for (const width of [1440, 390]) {
				await page.setViewportSize({ width, height: 1000 });
				const axe = await new AxeBuilder({ page }).include('main').analyze();
				expect(
					axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
				).toEqual([]);
				await expect(card).toBeVisible();
			}
		} finally {
			for (const id of ids) {
				db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
				db.prepare('DELETE FROM routes WHERE id=?').run(id);
			}
			db.close();
		}
	});
}
