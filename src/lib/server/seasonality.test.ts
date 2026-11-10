import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('./auth', () => ({ authScope: () => 'settings', isAuthEnabled: () => false }));
import { eq } from 'drizzle-orm';
import { db } from './db';
import { routes } from './db/schema';
import { upsertAscents } from './ingest';
import { listLogbook, wipeAllData } from './analytics';
import { buildBestMonthsView } from './bestMonths';
import {
	buildSeasonalitySearch,
	searchSeasonality,
	seasonalityCragKey,
	type SeasonalityRoute
} from './seasonality';
import { readSeasonalityFilters, seasonalityHref, currentSeasonalityMonth } from '#lib/seasonality';

const curve = (jan: number, nov: number) =>
	JSON.stringify([jan, 1, 1, 1, 1, 1, 1, 1, 1, 1, nov, 1]);
const row = (id: number, patch: Partial<SeasonalityRoute> = {}): SeasonalityRoute => ({
	id,
	provider: 'thecrag',
	externalId: String(id),
	name: `Climb ${id}`,
	cragName: 'Synthetic Crag',
	cragUrl: null,
	areaExternalId: 'crag-1',
	cragPath: 'Country - Area',
	parentName: 'Upper sector',
	country: 'Australia',
	gradeRaw: '19',
	url: null,
	seasonalityJson: curve(10, 5),
	ascentCount: 1,
	...patch
});
const filters = (query = '') => readSeasonalityFilters(new URLSearchParams(query), 11);

it('validates URL filters and preserves them across view/page navigation', () => {
	for (const month of ['0', '13', 'NaN', '1.5', '01', ''])
		expect(filters(`month=${month}`).month).toBe(11);
	expect(filters('month=1&view=routes&sort=name&q= upper &page=3')).toMatchObject({
		month: 1,
		view: 'routes',
		sort: 'name',
		q: 'upper',
		page: 3
	});
	const original = filters('month=12&q=upper&view=routes&sort=name&crag=one&page=2');
	const next = new URL(seasonalityHref(original, { page: 3 }), 'https://example.test');
	expect(readSeasonalityFilters(next.searchParams, 1)).toEqual({ ...original, page: 3 });
	expect(filters('page=Infinity&view=invalid&sort=invalid')).toMatchObject({
		page: 1,
		view: 'crags',
		sort: 'season'
	});
	const boundary = new Date('2026-10-31T15:00:00Z');
	expect(currentSeasonalityMonth(boundary, 'Australia/Brisbane')).toBe(11);
	expect(currentSeasonalityMonth(boundary, 'America/New_York')).toBe(10);
	expect(currentSeasonalityMonth(boundary, 'bad-zone')).toBe(10);
});

it('ranks by exact relative monthly strength, not raw magnitude, with stable name ties', () => {
	const rows = [
		row(1, { name: 'Z', seasonalityJson: curve(100, 50) }),
		row(2, { name: 'A', seasonalityJson: curve(2, 2) }),
		row(3, { name: 'B', seasonalityJson: curve(1, 1) }),
		row(4, { seasonalityJson: JSON.stringify(Array(12).fill(0)) })
	];
	expect(buildSeasonalitySearch(rows, filters('view=routes')).results.map((r) => r.key)).toEqual([
		'2',
		'3',
		'1',
		'4'
	]);
	expect(
		buildSeasonalitySearch(rows, filters('view=routes&month=1')).results.map((r) => r.key)
	).toEqual(['2', '3', '1', '4']);
	expect(buildSeasonalitySearch(rows, filters('view=routes')).results.at(-1)?.relative).toBeNull();
	const seasons = [
		row(1, { seasonalityJson: curve(10, 1) }),
		row(2, { seasonalityJson: curve(1, 10) })
	];
	expect(buildSeasonalitySearch(seasons, filters('view=routes&month=1')).results[0].key).toBe('1');
	expect(buildSeasonalitySearch(seasons, filters('view=routes&month=11')).results[0].key).toBe('2');
});

it('uses the existing ascent-weighted crag mean and does not narrow it when a climb name matches', () => {
	const rows = [
		row(1, { name: 'Match only me', ascentCount: 3, seasonalityJson: curve(10, 1) }),
		row(2, { seasonalityJson: curve(1, 10) }),
		row(3, { seasonalityJson: null })
	];
	const search = buildSeasonalitySearch(rows, filters('q=match'));
	const repeated = rows.flatMap((r) =>
		Array.from({ length: r.ascentCount }, () => ({
			routeId: r.id,
			cragName: r.cragName,
			cragUrl: r.cragUrl,
			ascentDate: null,
			seasonalityJson: r.seasonalityJson
		}))
	);
	expect(search.results[0].curve).toEqual(buildBestMonthsView(repeated).crags[0].seasonality);
	expect(search.results[0]).toMatchObject({ covered: 2, total: 3, value: 3.25 });
	expect(search.coverage).toEqual({ total: 1, covered: 1 });
});

it('keeps same-name areas and providers separate; matches names, areas and country without notes', () => {
	const rows = [
		row(1),
		row(2, { areaExternalId: 'crag-2' }),
		row(3, { provider: 'other' }),
		row(4, { seasonalityJson: '[1,2]' })
	];
	expect(buildSeasonalitySearch(rows, filters()).results).toHaveLength(3);
	expect(buildSeasonalitySearch(rows, filters('view=routes&q=UPPER')).total).toBe(3);
	const scoped = buildSeasonalitySearch(rows, {
		...filters('view=routes'),
		crag: seasonalityCragKey(rows[1])
	});
	expect(scoped.results.map((r) => r.key)).toEqual(['2']);
	expect(buildSeasonalitySearch(rows, filters('q=no-match')).total).toBe(0);
	expect(buildSeasonalitySearch(rows, filters()).coverage).toEqual({ total: 4, covered: 3 });
});

it('sorts before paginating and clamps pages after narrowing a search', () => {
	const rows = Array.from({ length: 30 }, (_, i) =>
		row(i + 1, { name: `Climb ${String(i).padStart(2, '0')}` })
	);
	const second = buildSeasonalitySearch(rows, filters('view=routes&page=2'));
	expect(second).toMatchObject({ total: 30, pages: 2, page: 2 });
	expect(second.results).toHaveLength(6);
	expect(second.results[0].name).toBe('Climb 24');
	expect(buildSeasonalitySearch(rows, filters('view=routes&page=999&q=Climb 29'))).toMatchObject({
		total: 1,
		page: 1
	});
});

beforeEach(() => wipeAllData());
it('reads logged routes once with ascent weights and links to exact logbook rows before pagination', () => {
	upsertAscents(
		Array.from({ length: 53 }, (_, i) => ({
			provider: 'thecrag',
			externalId: `s-${i}`,
			ascentDate: '2026-01-01',
			isSend: true,
			isAttempt: false,
			route: {
				provider: 'thecrag',
				externalId: i === 52 ? 'other' : 'same',
				name: 'Same name',
				cragName: 'Synthetic Crag'
			}
		}))
	);
	db.update(routes)
		.set({ seasonalityJson: curve(10, 1) })
		.where(eq(routes.externalId, 'same'))
		.run();
	const result = searchSeasonality(filters('view=routes'));
	expect(result).toMatchObject({ total: 1, coverage: { total: 2, covered: 1 } });
	const id = Number(
		new URL(result.results[0].logbookHref!, 'https://example.test').searchParams.get('route')
	);
	const logbook = listLogbook({ route: id, limit: 50, offset: 50 });
	expect(logbook.total).toBe(52);
	expect(logbook.rows).toHaveLength(2);
	expect(logbook.rows.every((r) => r.routeId === id)).toBe(true);
});
