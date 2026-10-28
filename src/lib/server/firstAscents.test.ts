import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { getDashboardStats, listLogbook, wipeAllData } from './analytics';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { ascents, routeHistoryFetches, routes } from './db/schema';
import {
	buildFirstAscentStats,
	getFirstAscentMarks,
	isFirstAscentImportSkipped,
	parseFirstAscentKind,
	routeExists,
	setFirstAscent,
	type FirstAscentRow
} from './firstAscents';
import { upsertAscents } from './ingest';
import { parseTheCragCsv } from './providers/thecrag';

const row = (p: Partial<FirstAscentRow>): FirstAscentRow => ({
	routeId: 1,
	kind: 'FA',
	routeName: 'Route',
	style: 'Sport',
	isBoulder: false,
	score: 20,
	gradeLabel: '20',
	band: 3,
	cragName: 'Crag',
	url: null,
	date: '2024-01-01',
	...p
});

describe('buildFirstAscentStats', () => {
	it('renders dashboard stats for same-named marked routes', () => {
		wipeAllData();
		for (const id of ['review-community-1', 'review-community-2']) {
			upsertAscents([
				{
					provider: 'thecrag',
					externalId: id,
					ascentDate: '2026-10-27',
					isSend: true,
					isAttempt: false,
					tickType: 'Red point',
					route: {
						provider: 'thecrag',
						externalId: id,
						name: 'Review shared route',
						gearStyle: 'Sport',
						gradeRaw: '20',
						gradeScore: 20,
						gradeSystem: 'ewbank'
					}
				}
			]);
			setFirstAscent('thecrag', id, 'FA');
		}
		const stats = getDashboardStats();
		expect(stats.firstAscents.recent).toHaveLength(2);
		expect(new Set(stats.hardestSends.map((climb) => climb.id)).size).toBe(2);
		const faMilestones = stats.milestones.items.filter((item) => item.kind === 'fa');
		expect(faMilestones).toHaveLength(2);
		expect(new Set(faMilestones.map((item) => item.id)).size).toBe(2);
		wipeAllData();
	});
	it('retains distinct route IDs for equal names and dates (#144)', () => {
		const stats = buildFirstAscentStats([row({ routeId: 1 }), row({ routeId: 2 })]);
		expect(stats.recent.map((r) => r.routeId)).toEqual([1, 2]);
	});
	it('is empty with no marks', () => {
		const s = buildFirstAscentStats([]);
		expect(s.total).toBe(0);
		expect(s.routeRange).toBeNull();
		expect(s.firstYear).toBeNull();
	});

	it('counts kinds, styles, years and keeps route and boulder ranges apart', () => {
		const s = buildFirstAscentStats([
			row({ routeId: 1, score: 18, gradeLabel: '18', date: '2019-05-01' }),
			row({ routeId: 2, score: 24, gradeLabel: '24', kind: 'FFA', style: 'Trad' }),
			row({ routeId: 3, score: null, gradeLabel: null, date: '2026-02-01' }),
			row({
				routeId: 4,
				style: 'Boulder',
				isBoulder: true,
				score: 4,
				gradeLabel: 'V4',
				date: '2022-03-01'
			})
		]);
		expect(s.total).toBe(4);
		expect(s.fa).toBe(3);
		expect(s.ffa).toBe(1);
		expect(s.byStyle.map((x) => [x.style, x.count])).toEqual([
			['Sport', 2],
			['Trad', 1],
			['Boulder', 1]
		]);
		// V4 must not become the "easiest route" under Ewbank 18.
		expect(s.routeRange).toMatchObject({ min: '18', max: '24', count: 2 });
		expect(s.boulderRange).toMatchObject({ min: 'V4', max: 'V4', count: 1 });
		expect([s.firstYear, s.latestYear]).toEqual([2019, 2026]);
		expect(s.recent[0].date).toBe('2026-02-01');
	});

	it('parses kinds strictly', () => {
		expect(parseFirstAscentKind('FA')).toBe('FA');
		expect(parseFirstAscentKind('FFA')).toBe('FFA');
		expect(parseFirstAscentKind('fa')).toBeNull();
		expect(parseFirstAscentKind('')).toBeNull();
	});
});

// In-memory DB (vitest.config.ts), seeded from the sample CSV.
describe('first ascent marks', () => {
	let route = '';
	beforeAll(() => {
		upsertAscents(parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv')));
		route = listLogbook({ q: 'Hard Project' }).rows[0].routeExternalId;
	});

	it('marks, flags logbook rows, feeds the dashboard and unmarks', () => {
		expect(routeExists('thecrag', route)).toBe(true);
		expect(routeExists('thecrag', 'nope')).toBe(false);

		setFirstAscent('thecrag', route, 'FA');
		setFirstAscent('thecrag', route, 'FFA'); // upsert, not a second row
		expect(getFirstAscentMarks().size).toBe(1);
		expect(listLogbook({ q: 'Hard Project' }).rows[0].firstAscent).toBe('FFA');

		const fa = getDashboardStats().firstAscents;
		expect(fa).toMatchObject({ total: 1, ffa: 1 });
		expect(fa.recent[0].routeName).toBe('Hard Project');

		setFirstAscent('thecrag', route, null);
		expect(getDashboardStats().firstAscents.total).toBe(0);
	});

	it('are removed by wipe', () => {
		setFirstAscent('thecrag', route, 'FA');
		wipeAllData();
		expect(getFirstAscentMarks().size).toBe(0);
	});

	it('records an import skip when unmarked so re-import can leave them alone', () => {
		setFirstAscent('thecrag', route, 'FA', { source: 'import' });
		setFirstAscent('thecrag', route, null);
		expect(isFirstAscentImportSkipped('thecrag', route)).toBe(true);
		setFirstAscent('thecrag', route, 'FA', { source: 'manual' });
		expect(isFirstAscentImportSkipped('thecrag', route)).toBe(false);
	});
});

describe('listLogbook FA and history filters', () => {
	let markedRoute = '';
	let otherRoute = '';

	beforeAll(() => {
		wipeAllData();
		upsertAscents(parseTheCragCsv(readFileSync('samples/thecrag-logbook-sample.csv')));
		markedRoute = listLogbook({ q: 'Hard Project' }).rows[0].routeExternalId;
		otherRoute = listLogbook({ limit: 100 }).rows.find(
			(r) => r.routeExternalId !== markedRoute
		)!.routeExternalId;
		setFirstAscent('thecrag', markedRoute, 'FA');
	});

	it('filters by fa=FA, fa=any, and fa=none', () => {
		const faOnly = listLogbook({ fa: 'FA' });
		expect(faOnly.total).toBeGreaterThan(0);
		expect(faOnly.rows.every((r) => r.firstAscent === 'FA')).toBe(true);
		expect(faOnly.rows.every((r) => r.routeExternalId === markedRoute)).toBe(true);

		const any = listLogbook({ fa: 'any' });
		expect(any.total).toBe(faOnly.total);
		expect(any.rows.every((r) => r.firstAscent != null)).toBe(true);

		const none = listLogbook({ fa: 'none' });
		expect(none.total).toBeGreaterThan(0);
		expect(none.rows.every((r) => r.firstAscent == null)).toBe(true);
		expect(none.rows.some((r) => r.routeExternalId === markedRoute)).toBe(false);
	});

	it('filters history=pending to routes not yet in route_history_fetches', () => {
		const before = listLogbook({ history: 'pending' });
		expect(before.total).toBeGreaterThan(0);
		expect(before.rows.some((r) => r.routeExternalId === markedRoute)).toBe(true);

		db.insert(routeHistoryFetches)
			.values({
				provider: 'thecrag',
				routeExternalId: markedRoute,
				status: 'ok',
				historyCount: 1,
				fetchedAt: new Date().toISOString()
			})
			.run();

		const after = listLogbook({ history: 'pending' });
		expect(after.rows.some((r) => r.routeExternalId === markedRoute)).toBe(false);
		expect(after.total).toBeLessThan(before.total);
		// other climbed routes still pending
		expect(after.rows.some((r) => r.routeExternalId === otherRoute)).toBe(true);
	});

	it('filters quality, minStars, with, and from/to', () => {
		const withStars = listLogbook({ minStars: 1 });
		expect(withStars.total).toBeGreaterThan(0);
		expect(withStars.rows.every((r) => r.stars != null && r.stars >= 1)).toBe(true);

		const good = listLogbook({ quality: 'Good' });
		expect(good.total).toBeGreaterThan(0);
		expect(good.rows.every((r) => r.quality === 'Good')).toBe(true);

		const partner = listLogbook({ with: 'Partner A' });
		expect(partner.total).toBeGreaterThan(0);
		expect(partner.rows.every((r) => (r.partners || '').includes('Partner A'))).toBe(true);

		const hardProject = listLogbook({ q: 'Hard Project' }).rows[0];
		db.update(routes)
			.set({
				tagsJson: JSON.stringify([{ category: 'Rock type', name: 'Granite' }])
			})
			.where(eq(routes.externalId, hardProject.routeExternalId))
			.run();
		const granite = listLogbook({ rock: 'granite' });
		expect(granite.total).toBeGreaterThan(0);
		expect(granite.rows.every((r) => r.routeExternalId === hardProject.routeExternalId)).toBe(true);
		const sandstone = listLogbook({ rock: 'Sandstone' });
		expect(sandstone.rows.some((r) => r.routeExternalId === hardProject.routeExternalId)).toBe(
			false
		);

		const ranged = listLogbook({ from: '2099-01-01', to: '2099-12-31' });
		expect(ranged.total).toBe(0);

		const inRange = listLogbook({ from: '2026-01-01', to: '2026-01-31' });
		expect(inRange.total).toBeGreaterThan(0);
		expect(
			inRange.rows.every((r) => {
				const d = (r.ascentDate || '').slice(0, 10);
				return d >= '2026-01-01' && d <= '2026-01-31';
			})
		).toBe(true);
	});

	it('excludes undated ascents from a To-only date bound', () => {
		const row = listLogbook({ q: 'Hard Project' }).rows[0];
		db.update(ascents).set({ ascentDate: null }).where(eq(ascents.id, row.id)).run();

		const toOnly = listLogbook({ to: '2025-12-31' });
		expect(toOnly.total).toBe(0);
		expect(toOnly.rows.every((r) => Boolean((r.ascentDate || '').slice(0, 10)))).toBe(true);

		const fromOnly = listLogbook({ from: '2020-01-01' });
		expect(fromOnly.rows.some((r) => r.id === row.id)).toBe(false);
	});

	it('supports multi tick/style/quality, partners mode, and route score range', () => {
		const ticks = listLogbook({ ticks: ['Onsight', 'Flash'] });
		expect(ticks.total).toBeGreaterThan(0);
		expect(
			ticks.rows.every((r) => ['onsight', 'flash'].includes((r.tickType || '').toLowerCase()))
		).toBe(true);

		const styles = listLogbook({ styles: ['Sport'] });
		expect(styles.total).toBeGreaterThan(0);

		const quals = listLogbook({ qualities: ['Good', 'Average'] });
		expect(quals.total).toBeGreaterThan(0);
		expect(quals.rows.every((r) => r.quality === 'Good' || r.quality === 'Average')).toBe(true);

		const hasPartners = listLogbook({ partners: 'has' });
		expect(hasPartners.rows.every((r) => Boolean((r.partners || '').trim()))).toBe(true);
		const missing = listLogbook({ partners: 'missing' });
		expect(missing.rows.every((r) => !(r.partners || '').trim())).toBe(true);

		const ranged = listLogbook({ minScore: 18, maxScore: 18 });
		expect(ranged.total).toBeGreaterThan(0);
		expect(
			ranged.rows.every((r) => Math.round(r.effectiveGradeScore ?? r.gradeScore ?? -1) === 18)
		).toBe(true);

		// from/to overrides year so a conflicting year does not empty the result incorrectly
		const dated = listLogbook({ from: '2026-01-01', to: '2026-01-31', year: 1999 });
		expect(dated.total).toBeGreaterThan(0);
	});

	it('filters missing height/bolts', () => {
		const noHeight = listLogbook({ missing: ['height'] });
		expect(noHeight.rows.every((r) => r.heightM == null)).toBe(true);
		const noBolts = listLogbook({ missing: ['bolts'] });
		expect(noBolts.rows.every((r) => r.bolts == null)).toBe(true);
	});
});
