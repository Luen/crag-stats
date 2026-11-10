import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import {
	ewbankToTheCragScore,
	theCragGradeScore,
	theCragScoreToEwbank
} from '../src/lib/grades/thecragScale';

test('native pyramid row keeps its grade range through logbook navigation', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const ids: number[] = [];
	try {
		for (const grade of ['6a', '6a+']) {
			const score = theCragScoreToEwbank(theCragGradeScore('FR', grade)!);
			const id = Number(
				db
					.prepare(
						`INSERT INTO routes (provider, external_id, name, gear_style, grade_raw, grade_score, grade_system, updated_at) VALUES ('thecrag', ?, ?, 'Sport', ?, ?, 'french', '2026-11-10')`
					)
					.run(`native-pyramid-${grade}`, `Native pyramid ${grade}`, grade, score).lastInsertRowid
			);
			ids.push(id);
			const insert = db.prepare(
				`INSERT INTO ascents (provider, external_id, route_id, ascent_date, tick_type, is_send, updated_at) VALUES ('thecrag', ?, ?, '2026-01-01', 'Red point', 1, '2026-11-10')`
			);
			for (let i = 0; i < (grade === '6a' ? 51 : 1); i++)
				insert.run(`native-pyramid-${grade}-${i}`, id);
		}
		await page.goto('/?system=french&boulderSystem=font');
		const pyramid = page
			.locator('article.panel')
			.filter({ has: page.getByRole('heading', { name: 'Sport', exact: true, level: 3 }) })
			.filter({ has: page.locator('.pyramid') });
		const link = pyramid.getByRole('link', { name: '6a', exact: true });
		const href = (await link.getAttribute('href'))!;
		const range = new URL(href, 'http://x').searchParams;
		expect(range.has('tcMin')).toBe(true);
		expect(range.has('tcMax')).toBe(true);
		expect(range.get('gradeScale')).toBe('route');
		const score = ewbankToTheCragScore(theCragScoreToEwbank(theCragGradeScore('FR', '6a')!));
		expect(score).toBeGreaterThanOrEqual(Number(range.get('tcMin')));
		expect(score).toBeLessThan(Number(range.get('tcMax')));
		await link.focus();
		await page.keyboard.press('Enter');
		await expect(page.locator('tbody tr')).toHaveCount(50);
		await expect(page.locator('tbody')).not.toContainText('Native pyramid 6a+');
		await page
			.getByRole('link', { name: /^Grade/ })
			.first()
			.click();
		await expect(page).toHaveURL(/tcMin=.*tcMax=/);
		await page.getByRole('button', { name: 'Apply filters' }).click();
		await expect(page).toHaveURL(/tcMin=.*tcMax=/);
		await page.getByRole('link', { name: 'Next →', exact: true }).click();
		await expect(page).toHaveURL(/tcMin=.*tcMax=.*page=2/);
		await expect(page.locator('tbody tr')).toHaveCount(1);
		expect(new URL(page.url()).searchParams.get('gradeScale')).toBe('route');
		await expect(page.locator('tbody')).toContainText('Native pyramid 6a');
		await expectAxeClean(page, { include: ['.filters', 'table'] });
	} finally {
		for (const id of ids) {
			db.prepare('DELETE FROM ascents WHERE route_id=?').run(id);
			db.prepare('DELETE FROM routes WHERE id=?').run(id);
		}
		db.close();
	}
});
