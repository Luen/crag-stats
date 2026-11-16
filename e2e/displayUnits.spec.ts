import Database from 'better-sqlite3';
import { expect, test } from '@playwright/test';
import { expectAxeClean } from './axe';

const SETTING_KEYS = [
	'date_format',
	'unit_height',
	'unit_distance',
	'unit_temperature',
	'unit_wind',
	'unit_precipitation'
];

const ROUTE_EXTERNAL_IDS = ['review-units-hot', 'review-units-gym'];

// #469 follow-ups: date formats and granular units are display-only, so the same logbook reads
// differently without any stored data changing (#485, #490).
test('Settings applies date format and unit presets across pages', async ({ page }) => {
	const db = new Database('e2e/.tmp/open.sqlite');
	const saved = db
		.prepare(
			`SELECT key, value, updated_at FROM app_settings WHERE key IN (${SETTING_KEYS.map(() => '?').join(',')})`
		)
		.all(...SETTING_KEYS) as { key: string; value: string; updated_at: string }[];
	const resetSettings = () => {
		db.prepare(
			`DELETE FROM app_settings WHERE key IN (${SETTING_KEYS.map(() => '?').join(',')})`
		).run(...SETTING_KEYS);
		const restore = db.prepare(
			'INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)'
		);
		for (const row of saved) restore.run(row.key, row.value, row.updated_at);
	};
	try {
		// A cached hot outdoor day plus an indoor row, so the weather surfaces can be read.
		const routeId = Number(
			db
				.prepare(
					`INSERT INTO routes
					(provider, external_id, name, crag_name, gear_style, height_m, lat, lon, updated_at)
					VALUES ('thecrag', ?, 'Review units hot', 'Review Units Crag', 'Sport', 30, 12, 34, '2026-10-28')`
				)
				.run(ROUTE_EXTERNAL_IDS[0]).lastInsertRowid
		);
		db.prepare(
			`INSERT INTO ascents (provider, external_id, route_id, ascent_date, is_send, tick_type, height_m, updated_at)
				VALUES ('thecrag', ?, ?, '2026-10-29', 1, 'Red point', 30, '2026-10-28')`
		).run(ROUTE_EXTERNAL_IDS[0], routeId);
		db.prepare(
			`INSERT INTO weather_days (lat_key, lon_key, day, temp_max_c, temp_min_c, precip_mm, wind_max_kmh, weather_code, status, fetched_at)
				VALUES (12, 34, '2026-10-29', 38, 10, 0, 60, 0, 'ok', '2026-10-28')`
		).run();

		await page.goto('/settings');
		const card = page.locator('article.panel').filter({
			has: page.getByRole('heading', { name: 'Display & visibility' })
		});
		const dateFormat = card.getByRole('combobox', { name: 'Date format' });
		const height = card.getByRole('combobox', { name: 'Height' });
		const distance = card.getByRole('combobox', { name: 'Distance' });
		const temperature = card.getByRole('combobox', { name: 'Temperature' });
		const wind = card.getByRole('combobox', { name: 'Wind speed' });
		const precipitation = card.getByRole('combobox', { name: 'Precipitation' });
		await expect(height).toHaveValue('m');

		// The display section explains what stays metric (#487).
		await expect(card.getByRole('link', { name: 'How display settings work' })).toHaveAttribute(
			'href',
			'/docs/display-settings'
		);

		await dateFormat.selectOption('mm/dd/yyyy');
		await card.getByRole('button', { name: 'Imperial (US)' }).click();
		await expect(height).toHaveValue('ft');
		await expect(distance).toHaveValue('mi');
		await expect(temperature).toHaveValue('fahrenheit');
		await expect(wind).toHaveValue('mph');
		await expect(precipitation).toHaveValue('in');
		await expectAxeClean(page, { include: [card] });
		await card.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();

		await page.reload();
		await expect(dateFormat).toHaveValue('mm/dd/yyyy');
		await expect(height).toHaveValue('ft');
		await expect(distance).toHaveValue('mi');
		await expect(temperature).toHaveValue('fahrenheit');

		await page.goto('/');
		const distanceMetric = page
			.locator('.metric')
			.filter({ has: page.getByText('distance climbed', { exact: true }) });
		await expect(distanceMetric.locator('strong')).toHaveText(/mi$/);
		await expect(distanceMetric.locator('strong')).not.toHaveText(/km$/);
		const recent = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Recent activities', exact: true }) });
		const climb = recent.locator('li').filter({ hasText: 'Review units hot' });
		await expect(climb).toContainText('10/29/2026');
		await expect(climb.getByRole('list', { name: 'Weather on the day' })).toContainText(
			'Hot 100°F'
		);
		const weatherCard = page
			.locator('article')
			.filter({ has: page.getByRole('heading', { name: 'Weather conditions', exact: true }) });
		await expect(weatherCard).toContainText('100°F');
		await expectAxeClean(page, { include: [weatherCard, recent] });

		// The logbook day filter and weather chips follow the same choices.
		await page.goto('/logbook?day=2026-10-29');
		await expect(page.getByText('10/29/2026').first()).toBeVisible();
		await expect(page.locator('tbody')).toContainText('Review units hot');
		await expect(page.getByRole('list', { name: 'Weather on the day' }).first()).toContainText(
			'Hot 100°F'
		);

		// Badge wording converts while ids and thresholds stay metric.
		await page.goto('/badges');
		const dayHeight = page.locator('article.card').filter({
			has: page.getByRole('heading', { name: '250m Day', exact: true })
		});
		await expect(dayHeight).toContainText('Climb 820 ft in a single day');
		await expect(page.getByText('Climb a cumulative 0.6 mi').first()).toBeVisible();

		// Height goals ask in feet but store metres.
		await page.goto('/goals');
		const goalForm = page
			.locator('section')
			.filter({ has: page.getByRole('heading', { name: 'Add goal' }) });
		await goalForm.getByRole('combobox', { name: 'Kind' }).selectOption('height_year');
		await goalForm.getByRole('textbox', { name: 'Title' }).fill('Review units height');
		await goalForm.getByRole('textbox', { name: 'Target height (ft)' }).fill('16404');
		await goalForm.getByRole('button', { name: 'Add' }).click();
		const heightGoal = page.locator('article.goal').filter({ hasText: 'Review units height' });
		await expect(heightGoal).toContainText('16404 ft');
		await expectAxeClean(page, { include: [heightGoal] });

		// One-off overrides preview another preset without saving it.
		await page.goto('/?units=metric');
		await expect(distanceMetric.locator('strong')).toHaveText(/km$/);
		await page.goto('/');
		await expect(distanceMetric.locator('strong')).toHaveText(/mi$/);

		// Back to the defaults, then confirm the stored copy really changed.
		await page.goto('/settings');
		await dateFormat.selectOption('auto');
		await card.getByRole('button', { name: 'Metric', exact: true }).click();
		await card.getByRole('button', { name: 'Save preferences' }).click();
		await expect(page.getByText('Preferences saved.')).toBeVisible();
		await page.goto('/');
		await expect(distanceMetric.locator('strong')).toHaveText(/km$/);
		await expect(climb).toContainText('29 Oct 2026');
	} finally {
		db.prepare(`DELETE FROM goals WHERE title = 'Review units height'`).run();
		for (const externalId of ROUTE_EXTERNAL_IDS) {
			db.prepare('DELETE FROM ascents WHERE external_id = ?').run(externalId);
		}
		db.prepare(
			`DELETE FROM routes WHERE external_id IN (${ROUTE_EXTERNAL_IDS.map(() => '?').join(',')})`
		).run(...ROUTE_EXTERNAL_IDS);
		db.prepare(`DELETE FROM weather_days WHERE lat_key = 12 AND lon_key = 34`).run();
		resetSettings();
		db.close();
	}
});
