import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

test('badge and dashboard climb companions wrap and remain readable on mobile', async ({
	page
}) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const partners = 'Alex, Sam, Jo, AveryWithAnExtraordinarilyLongUnbrokenDisplayName';
	const id = Number(
		db
			.prepare(
				`INSERT INTO routes (provider,external_id,name,gear_style,grade_score,grade_system,updated_at)
		VALUES ('thecrag','partner-context','Synthetic partner climb','Sport',38,'ewbank','2026-11-01')`
			)
			.run().lastInsertRowid
	);
	try {
		db.prepare(
			`INSERT INTO ascents (provider,external_id,route_id,ascent_date,tick_type,is_send,partners,comment,updated_at)
			VALUES ('thecrag','partner-context',?,'2026-11-01','Onsight',1,?,'PRIVATE NOTE MUST STAY HIDDEN','2026-11-01')`
		).run(id, partners);
		await page.goto('/badges');
		const badge = page
			.locator('article.card')
			.filter({ has: page.getByRole('heading', { name: 'Crowded Belay', exact: true }) });
		await expect(badge).toContainText(`Partners on this ascent: ${partners}`);
		await page.setViewportSize({ width: 390, height: 844 });
		await expectAxeClean(page, { include: [badge] });
		await page.goto('/');
		const cards = [];
		for (const title of ['Hardest sends', 'Notable ascents', 'Recent activities']) {
			const card = page
				.locator('article')
				.filter({ has: page.getByRole('heading', { name: title, exact: true }) })
				.first();
			await expect(card).toContainText(`Partners on this ascent: ${partners}`);
			cards.push(card);
		}
		await expect(page.locator('body')).not.toContainText('PRIVATE NOTE MUST STAY HIDDEN');
		await expectAxeClean(page, { include: cards });
	} finally {
		db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
		db.prepare('DELETE FROM routes WHERE id=?').run(id);
		db.close();
	}
});
