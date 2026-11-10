import { DASH_LAYOUT_COOKIE, resolveDashLayout } from '#lib/dashboardLayout';
import { applyDisplaySystemOverrides, formatClimbGrade } from '#lib/grades';
import { getDashboardStats, parsePyramidMode } from '#lib/server/analytics';
import { getAppSetting, getDisplayGradeSystems } from '#lib/server/appSettings';
import { listActiveGoals } from '#lib/server/goals';
import { listDashboardProjects } from '#lib/server/projects';
import { loadProjectProgressRows } from '#lib/server/projectDetails';
import { projectProgress } from '#lib/server/projectProgress';
import { getSyncStatus } from '#lib/server/sync';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, url, parent }) => {
	// Site default from Settings; `?system=` (route or boulder system) and `?boulderSystem=`
	// are one-off overrides for shared links.
	const gradeSystems = applyDisplaySystemOverrides(getDisplayGradeSystems(), url.searchParams);
	const pyramidMode = parsePyramidMode(url.searchParams.get('pyramid'));

	const { dateDisplay } = await parent();
	const stats = getDashboardStats(gradeSystems, { pyramidMode, dateDisplay });
	const projects = listDashboardProjects(3);
	const progressRows = projects.length ? loadProjectProgressRows() : [];
	const today = new Date().toISOString().slice(0, 10);
	const dashboardProjects = projects.map((project) => {
		const { pct, horizon } = projectProgress(project, progressRows, today);
		return {
			...project,
			gradeLabel: formatClimbGrade(project, gradeSystems),
			progress: { pct, horizon }
		};
	});
	return {
		stats,
		// Share-preview text (#44); the layout only emits it when indexing is allowed.
		og: {
			title: stats.profileName ? `${stats.profileName}'s crag year · Crag Stats` : 'Crag Stats',
			description:
				stats.blurb.paragraphs[0] ??
				'Self-hosted climbing analytics for a theCrag logbook: grade pyramids, CPR, projects and goals.'
		},
		sync: getSyncStatus(),
		gradeSystems,
		pyramidMode,
		activeGoals: listActiveGoals(3),
		dashboardProjects,
		// Site-wide so visitors see the owner's layout (#37); cookie is a legacy fallback.
		dashLayout: resolveDashLayout(
			getAppSetting('dashboard_layout'),
			cookies.get(DASH_LAYOUT_COOKIE)
		)
	};
};
