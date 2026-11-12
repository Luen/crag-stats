import { describe, expect, it } from 'vitest';
import { db } from './db';
import { ascents, routes } from './db/schema';
import { getDashboardStats } from './analytics';
import { getTickTypeSettings, listAvailableTickTypes, setTickTypeSettings } from './appSettings';
import { refreshProjects, listProjects } from './projects';
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
});
