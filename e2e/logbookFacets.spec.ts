import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';

test('project and setter controls filter results and survive sort/pagination', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const profile = db.prepare("SELECT id, login FROM profiles WHERE provider = 'thecrag'").get() as
		{ id: number; login: string | null } | undefined;
	let insertedProfile: number | undefined;
	const routeIds: number[] = [];
	const crag = 'Facet review crag';
	try {
		if (profile) {
			db.prepare('UPDATE profiles SET login = ? WHERE id = ?').run('facet-owner', profile.id);
		} else {
			insertedProfile = Number(
				db
					.prepare(
						"INSERT INTO profiles (provider, login, updated_at) VALUES ('thecrag', 'facet-owner', '2026-01-01')"
					)
					.run().lastInsertRowid
			);
		}
		for (let i = 0; i < 53; i++) {
			const mine = i < 51;
			const name = mine
				? `Facet mine ${String(i).padStart(2, '0')}`
				: i === 51
					? 'Facet other'
					: 'Facet unknown';
			const externalId = `facet-review-${i}`;
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider, external_id, name, gear_style, grade_raw, grade_score, grade_system, crag_name, is_project, updated_at)
				VALUES ('thecrag', ?, ?, 'Sport', '20', 20, 'ewbank', ?, ?, '2026-01-01')`
					)
					.run(externalId, name, crag, mine ? 1 : i === 51 ? 0 : null).lastInsertRowid
			);
			routeIds.push(id);
			db.prepare(
				`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, updated_at)
				VALUES ('thecrag', ?, ?, '2026-01-01', 1, 'Red point', '2026-01-01')`
			).run(externalId, id);
			if (i !== 52) {
				db.prepare(
					`INSERT INTO route_history (provider, route_external_id, history_external_id, type, climbers, updated_at)
					VALUES ('thecrag', ?, ?, 'Route Setter', ?, '2026-01-01')`
				).run(externalId, externalId, mine ? '@facet-owner' : '@someone-else');
			}
		}
		const project = page.getByRole('combobox', { name: 'theCrag project flag' });
		const setter = page.getByRole('combobox', { name: 'Route setter' });
		await page.goto(`/logbook?crag=${encodeURIComponent(crag)}`);
		await project.selectOption('yes');
		await setter.selectOption('me');
		await page.getByRole('button', { name: 'Apply filters' }).click();
		await expect(page.locator('.head p')).toContainText('51 ascents');
		await expect(page.locator('tbody tr')).toHaveCount(50);
		const preservesFacets = (url: URL) =>
			url.searchParams.get('project') === 'yes' && url.searchParams.get('setter') === 'me';
		await expect(page).toHaveURL(preservesFacets);
		await page
			.locator('thead')
			.getByRole('link', { name: /^Grade/ })
			.click();
		await expect(page).toHaveURL(
			(url) => preservesFacets(url) && url.searchParams.get('sort') === 'grade'
		);
		await page.getByRole('link', { name: 'Next →' }).click();
		await expect(page).toHaveURL(
			(url) => preservesFacets(url) && url.searchParams.get('page') === '2'
		);
		await expect(page.locator('tbody tr')).toHaveCount(1);
		await expect(page.locator('tbody')).toContainText('Facet mine');

		await project.selectOption('no');
		await setter.selectOption('');
		await page.getByRole('button', { name: 'Apply filters' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(1);
		await expect(page.locator('tbody')).toContainText('Facet other');
		await expect(page.locator('tbody')).not.toContainText('Facet unknown');
		await project.selectOption('');
		await setter.selectOption('none');
		await page.getByRole('button', { name: 'Apply filters' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(2);
		await expect(page.locator('tbody')).toContainText('Facet other');
		await expect(page.locator('tbody')).toContainText('Facet unknown');
		await expect(page.locator('.hint')).toContainText('history has not been imported');

		await page.goto(`/logbook?crag=${encodeURIComponent(crag)}&project=invalid&setter=invalid`);
		await expect(project).toHaveValue('');
		await expect(setter).toHaveValue('');
		await expect(page.locator('.head p')).toContainText('53 ascents');
	} finally {
		for (const id of routeIds) {
			db.prepare(
				"DELETE FROM route_history WHERE provider = 'thecrag' AND route_external_id = (SELECT external_id FROM routes WHERE id = ?)"
			).run(id);
			db.prepare('DELETE FROM ascents WHERE route_id = ?').run(id);
			db.prepare('DELETE FROM routes WHERE id = ?').run(id);
		}
		if (profile)
			db.prepare('UPDATE profiles SET login = ? WHERE id = ?').run(profile.login, profile.id);
		if (insertedProfile != null)
			db.prepare('DELETE FROM profiles WHERE id = ?').run(insertedProfile);
		db.close();
	}
});
