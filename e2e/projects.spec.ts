import Database from 'better-sqlite3';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { PORTS } from '../playwright.config';

for (const colorScheme of ['light', 'dark'] as const)
	test.describe(`project thresholds in ${colorScheme}`, () => {
		test.use({ colorScheme });
		test('shows two-day and same-day completed projects, with valid session totals and private notes hidden', async ({
			page
		}) => {
			const db = new Database('e2e/.tmp/open.sqlite');
			const ids: number[] = [];
			const day = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
			const previous = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10);
			const add = (name: string, entries: [string | null, boolean, number][]) => {
				const id = Number(
					db
						.prepare(
							`INSERT INTO routes (provider,external_id,name,crag_name,gear_style,grade_raw,grade_score,grade_system,updated_at) VALUES ('thecrag',?,?,'Synthetic project cliff','Sport','24',24,'ewbank',?)`
						)
						.run(`project-rule-${ids.length}`, name, day).lastInsertRowid
				);
				ids.push(id);
				for (const [i, [date, send, tries]] of entries.entries())
					db.prepare(
						`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,is_attempt,number_attempts,comment,updated_at) VALUES ('thecrag',?,?,?,?,?,?,?,'Projects private fixture note',?)`
					).run(
						`project-rule-${id}-${i}`,
						id,
						date,
						send ? 'Red point' : 'Attempt',
						Number(send),
						Number(!send),
						tries,
						day
					);
			};
			try {
				add('One-day trial fixture', [
					[day, false, 5],
					[day, false, 1]
				]);
				add('Two-day project threshold fixture', [
					[previous, false, 1],
					[day, false, 1],
					['2026-02-30', false, 1],
					[null, false, 1]
				]);
				add('Same-day completed project fixture', [[day, true, 3]]);
				add('After-send work fixture', [
					[`${day}T09:00:00Z`, true, 1],
					[`${day}T10:00:00Z`, false, 3]
				]);
				add('Indoor project threshold fixture', [
					[previous, false, 1],
					[day, false, 1]
				]);
				await page.goto('/projects');
				await expect(page.locator('.blurb')).toContainText('two separate climbing days');
				const working = page
					.locator('article.card')
					.filter({ has: page.getByRole('link', { name: 'Two-day project threshold fixture' }) });
				await expect(working).toBeVisible();
				await expect(working.locator('.footer')).toContainText('2 sessions');
				await expect(working.locator('.badge')).toHaveText('open');
				const completed = page
					.locator('article.card')
					.filter({ has: page.getByRole('link', { name: 'Same-day completed project fixture' }) });
				await expect(completed).toBeVisible();
				await expect(completed.locator('.badge')).toHaveText('sent');
				for (const name of [
					'One-day trial fixture',
					'After-send work fixture',
					'Indoor project threshold fixture'
				])
					await expect(page.getByRole('link', { name })).toHaveCount(0);
				await expect(page.locator('body')).not.toContainText('Projects private fixture note');
				for (const width of [1440, 390]) {
					await page.setViewportSize({ width, height: 1000 });
					const axe = await new AxeBuilder({ page }).include('main').analyze();
					expect(
						axe.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
					).toEqual([]);
				}
				await page.goto(`http://localhost:${PORTS.settings}/projects`);
				await expect(page.getByText('No open projects yet.')).toContainText(
					'two different climbing days'
				);
			} finally {
				for (const id of ids) {
					db.prepare('DELETE FROM projects WHERE route_id=?').run(id);
					db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
					db.prepare('DELETE FROM routes WHERE id=?').run(id);
				}
				db.close();
			}
		});
	});
