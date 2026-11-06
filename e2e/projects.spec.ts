import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';
import { PORTS } from '../playwright.config';

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
		for (let i = 0; i < 3; i++) {
			add(`Comparable completed project ${i}`, [
				[new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10), false, 3],
				[previous, false, 3],
				[day, true, 1]
			]);
		}
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
			await expectAxeClean(page, { include: ['main'] });
		}
		await working.getByRole('link', { name: 'Two-day project threshold fixture' }).click();
		await expect(page).toHaveURL(new RegExp(`/projects/${ids[1]}$`));
		await expect(
			page.getByRole('heading', { name: 'Session progression', exact: true })
		).toBeVisible();
		await expect(
			page.getByRole('region', { name: 'Session progression table' }).locator('tbody tr')
		).toHaveCount(2);
		await expect(page.getByText('1 more session', { exact: true })).toBeVisible();
		await expect(page.getByText(/more tries, including the send/)).toBeVisible();
		expect(await page.content()).not.toContain('Projects private fixture note');
		await expectAxeClean(page, { include: ['main'] });
		await page.getByText('How approximate readiness and estimates work', { exact: true }).click();
		await expectAxeClean(page, { include: ['#method'] });
		const logbook = page.getByRole('link', {
			name: 'View all logged climbs on Two-day project threshold fixture'
		});
		await expect(logbook).toHaveAttribute('href', `/logbook?route=${ids[1]}`);
		await logbook.click();
		await expect(page.locator('tbody tr')).toHaveCount(4);
		await page.goto('/');
		const dashboardCard = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Projects', exact: true }) });
		await expect(dashboardCard.getByRole('progressbar').first()).toBeVisible();
		await expectAxeClean(page, { include: [dashboardCard] });
		await dashboardCard.getByRole('link', { name: 'Two-day project threshold fixture' }).click();
		await expect(page).toHaveURL(new RegExp(`/projects/${ids[1]}$`));
		await page.goto(`/projects/${ids[2]}`);
		await expect(page.getByText('This project is sent.', { exact: false })).toBeVisible();
		const invalid = await page.goto('/projects/not-a-route');
		expect(invalid?.status()).toBe(404);
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
