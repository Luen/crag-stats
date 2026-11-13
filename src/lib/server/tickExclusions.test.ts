import { describe, expect, it } from 'vitest';
import { db } from './db';
import { ascents, routes } from './db/schema';
import { getDashboardStats } from './analytics';
import { getTickTypeSettings, listAvailableTickTypes, setTickTypeSettings } from './appSettings';
import { refreshProjects, listProjects } from './projects';
import { listRewindYears } from './rewind';
import { listSectors } from './sectors';
import { searchSeasonality } from './seasonality';
import { readSeasonalityFilters } from '#lib/seasonality';
import { wipeAllData } from './wipe';

function seedAscents() {
	wipeAllData();

	const sportRoute = db
		.insert(routes)
		.values({
			provider: 'thecrag',
			externalId: 'route_sport_1',
			name: 'Sport Climb',
			gradeRaw: '20',
			gradeScore: 20,
			gradeBand: 2,
			gearStyle: 'Sport',
			updatedAt: '2026-01-01'
		})
		.returning()
		.get();

	const boulderRoute = db
		.insert(routes)
		.values({
			provider: 'thecrag',
			externalId: 'route_boulder_1',
			name: 'Boulder Problem',
			gradeRaw: 'V5',
			gradeScore: 5,
			gradeBand: 4,
			gearStyle: 'Boulder',
			gradeSystem: 'v_scale',
			updatedAt: '2026-01-01'
		})
		.returning()
		.get();

	// 2 sends on sport
	db.insert(ascents)
		.values({
			provider: 'thecrag',
			externalId: 'ascent_1',
			routeId: sportRoute.id,
			ascentDate: '2026-03-01',
			tickType: 'Red point',
			isSend: true,
			isAttempt: false,
			updatedAt: '2026-03-01'
		})
		.run();
	db.insert(ascents)
		.values({
			provider: 'thecrag',
			externalId: 'ascent_2',
			routeId: sportRoute.id,
			ascentDate: '2026-03-02',
			tickType: 'Onsight',
			isSend: true,
			isAttempt: false,
			updatedAt: '2026-03-02'
		})
		.run();

	// 10 "Working" ticks on boulder (would heavily distort boulder share and make climber type "Boulder climber")
	for (let i = 1; i <= 10; i++) {
		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: `ascent_boulder_work_${i}`,
				routeId: boulderRoute.id,
				ascentDate: `2026-03-1${i % 10}`,
				tickType: 'Working',
				isSend: false,
				isAttempt: true,
				updatedAt: '2026-03-15'
			})
			.run();
	}

	return { sportRoute, boulderRoute };
}

describe('configurable counted tick types', () => {
	it('counts all logged ticks by default', () => {
		seedAscents();
		setTickTypeSettings({});

		const stats = getDashboardStats();
		expect(stats.totalAscents).toBe(12);
		expect(stats.totalLogged).toBe(12);
		expect(stats.isFiltered).toBe(false);

		// With all ticks counted, Boulder dominates (10 / 12 ≈ 83.3%) -> Boulder climber
		const boulderShare = stats.styleShare.find((s) => s.style === 'Boulder');
		expect(boulderShare?.count).toBe(10);
		expect(stats.climberType).toBe('Boulder climber');

		// Project detection finds Boulder Problem as working on
		refreshProjects();
		const projects = listProjects('open');
		expect(projects.some((p) => p.routeName === 'Boulder Problem')).toBe(true);
	});

	it('filters out Working from analytics when set to projects_goals', () => {
		seedAscents();
		setTickTypeSettings({ working: 'projects_goals' });

		const stats = getDashboardStats();
		// Only the 2 Sport sends count toward ascents
		expect(stats.totalAscents).toBe(2);
		expect(stats.totalLogged).toBe(12);
		expect(stats.isFiltered).toBe(true);

		// Style share: only Sport ticks are counted (100% Sport) -> Sport climber
		expect(stats.styleShare.find((s) => s.style === 'Boulder')).toBeUndefined();
		expect(stats.styleShare.find((s) => s.style === 'Sport')?.count).toBe(2);
		expect(stats.climberType).toBe('Sport climber');

		// Pyramids in all mode do not include Working
		const boulderPyramid = stats.stylePyramidsByMode.all.find((p) => p.style === 'Boulder');
		expect(boulderPyramid).toBeUndefined();

		// Activity Heatmap still preserves projecting days (count > 0, sends = 0)
		const projectingDays = stats.heatmap.filter((d) => d.count > 0 && d.sends === 0);
		expect(projectingDays.length).toBeGreaterThan(0);

		// Projects still detect the boulder project because working is kept for projects
		refreshProjects();
		const projects = listProjects('open');
		expect(projects.some((p) => p.routeName === 'Boulder Problem')).toBe(true);
	});

	it('excludes completely when set to hide', () => {
		seedAscents();
		setTickTypeSettings({ working: 'hide' });

		const stats = getDashboardStats();
		expect(stats.totalAscents).toBe(2);
		expect(stats.totalLogged).toBe(12);
		expect(stats.isFiltered).toBe(true);

		// Heatmap has no projecting days because working is hidden completely
		const projectingDays = stats.heatmap.filter((d) => d.count > 0 && d.sends === 0);
		expect(projectingDays.length).toBe(0);

		// Projects do NOT detect the boulder problem because working ticks were hidden
		refreshProjects();
		const projects = listProjects('open');
		expect(projects.some((p) => p.routeName === 'Boulder Problem')).toBe(false);
	});

	it('persists and lists available tick types with counts', () => {
		seedAscents();
		const available = listAvailableTickTypes();
		const working = available.find((t) => t.key === 'working');
		expect(working?.count).toBe(10);
		const redpoint = available.find((t) => t.key === 'red point');
		expect(redpoint?.count).toBe(1);

		setTickTypeSettings({ working: 'projects_goals', attempt: 'hide' });
		const loaded = getTickTypeSettings();
		expect(loaded).toEqual({ working: 'projects_goals', attempt: 'hide' });
	});

	it('keeps account totals when a configured tick type has no logged rows', () => {
		seedAscents();
		// 'dab' is configured but never logged, so nothing is excluded from analytics.
		setTickTypeSettings({ dab: 'hide' });

		const stats = getDashboardStats();
		expect(stats.totalAscents).toBe(12);
		expect(stats.isFiltered).toBe(false);
	});

	it('keeps provider tick names outside the standard list classified by send/attempt', () => {
		wipeAllData();
		const route = db
			.insert(routes)
			.values({
				provider: 'thecrag',
				externalId: 'route_second',
				name: 'Seconded Route',
				gearStyle: 'Trad',
				updatedAt: '2026-01-01'
			})
			.returning()
			.get();
		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: 'ascent_second',
				routeId: route.id,
				ascentDate: '2026-04-01',
				tickType: 'Second',
				isSend: true,
				isAttempt: false,
				updatedAt: '2026-04-01'
			})
			.run();

		const second = listAvailableTickTypes().find((t) => t.key === 'second');
		expect(second?.isSend).toBe(true);
	});

	it('drops hidden tick types from rewind years, sectors, and seasonality weights', () => {
		wipeAllData();
		const seasonality = JSON.stringify([1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
		const hiddenRoute = db
			.insert(routes)
			.values({
				provider: 'thecrag',
				externalId: 'route_proj_only',
				name: 'Projected Problem',
				cragName: 'Hidden Crag',
				gearStyle: 'Boulder',
				gradeSystem: 'v_scale',
				gradeRaw: 'V6',
				gradeScore: 6,
				seasonalityJson: seasonality,
				updatedAt: '2026-01-01'
			})
			.returning()
			.get();
		const sentRoute = db
			.insert(routes)
			.values({
				provider: 'thecrag',
				externalId: 'route_sent',
				name: 'Sent Climb',
				cragName: 'Counted Crag',
				gearStyle: 'Sport',
				gradeRaw: '18',
				gradeScore: 18,
				seasonalityJson: seasonality,
				updatedAt: '2026-01-01'
			})
			.returning()
			.get();

		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: 'ascent_proj_2024',
				routeId: hiddenRoute.id,
				ascentDate: '2024-06-01',
				tickType: 'Working',
				isSend: false,
				isAttempt: true,
				updatedAt: '2024-06-01'
			})
			.run();
		db.insert(ascents)
			.values({
				provider: 'thecrag',
				externalId: 'ascent_sent_2026',
				routeId: sentRoute.id,
				ascentDate: '2026-05-01',
				tickType: 'Red point',
				isSend: true,
				isAttempt: false,
				updatedAt: '2026-05-01'
			})
			.run();

		setTickTypeSettings({ working: 'hide' });

		expect(listRewindYears()).toEqual([2026]);
		const crags = listSectors().map((c) => c.cragName);
		expect(crags).toEqual(['Counted Crag']);

		const filters = readSeasonalityFilters(new URLSearchParams('view=crags'), 3);
		const season = searchSeasonality(filters);
		expect(season.coverage.total).toBe(1);
		expect(season.results.map((r) => r.name)).toEqual(['Counted Crag']);
	});

	it('drops hidden tick types from the remaining dashboard surfaces', () => {
		const { sportRoute } = seedAscents();
		// Ten more counted sport ticks so Route repeats passes its 20-dated-ascent floor.
		for (let i = 1; i <= 10; i++) {
			db.insert(ascents)
				.values({
					provider: 'thecrag',
					externalId: `ascent_sport_repeat_${i}`,
					routeId: sportRoute.id,
					ascentDate: `2026-04-${String(i).padStart(2, '0')}`,
					tickType: 'Red point',
					isSend: true,
					isAttempt: false,
					updatedAt: '2026-04-10'
				})
				.run();
		}

		const sessionsOf = (stats: ReturnType<typeof getDashboardStats>) =>
			Object.values(stats.sessionsPerWeek.byYear['2026'] ?? []).reduce(
				(sum, w) => sum + w.sessions,
				0
			);

		setTickTypeSettings({});
		const counted = getDashboardStats();
		// 12 seeded days + 10 April sends, all on distinct days.
		expect(counted.eddington.activeDays).toBe(22);
		expect(sessionsOf(counted)).toBe(22);
		expect(counted.weekday.allTime.all.totalAscents).toBe(22);
		expect(counted.routeRepeats?.allTime.all.ascents).toBe(22);

		setTickTypeSettings({ working: 'hide' });
		const filtered = getDashboardStats();
		expect(filtered.eddington.activeDays).toBe(12);
		expect(sessionsOf(filtered)).toBe(12);
		expect(filtered.weekday.allTime.all.totalAscents).toBe(12);
		// Twelve counted dated ascents sit below Route repeats' 20-row floor.
		expect(filtered.routeRepeats).toBeNull();
	});

	it('excludes hidden ticks from the athlete profile axes', () => {
		wipeAllData();
		const route = db
			.insert(routes)
			.values({
				provider: 'thecrag',
				externalId: 'route_profile',
				name: 'Profile Route',
				gearStyle: 'Sport',
				updatedAt: '2026-01-01'
			})
			.returning()
			.get();
		const today = new Date().toISOString().slice(0, 10);
		for (const [externalId, tickType, isSend] of [
			['ascent_profile_send', 'Red point', true],
			['ascent_profile_working', 'Working', false]
		] as const) {
			db.insert(ascents)
				.values({
					provider: 'thecrag',
					externalId,
					routeId: route.id,
					ascentDate: today,
					tickType,
					isSend,
					isAttempt: !isSend,
					updatedAt: today
				})
				.run();
		}

		const volume = (stats: ReturnType<typeof getDashboardStats>) =>
			stats.athleteProfile.axes.find((a) => a.key === 'volume')?.last30;

		setTickTypeSettings({});
		// Two counted rows inside the 30-day window: 2 / (30 × 0.35) × 100 ≈ 19.
		expect(volume(getDashboardStats())).toBe(19);

		setTickTypeSettings({ working: 'hide' });
		expect(volume(getDashboardStats())).toBe(10);
	});
});
