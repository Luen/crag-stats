import { listActiveProjects, refreshProjects } from '#lib/server/projects';
import { formatClimbGrade } from '#lib/grades';
import { getDisplayGradeSystems } from '#lib/server/appSettings';
import { loadProjectProgressRows } from '#lib/server/projectDetails';
import { projectProgress } from '#lib/server/projectProgress';
import { saveProjectSelection } from '#lib/server/projectSelectionAction';
import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = { selection: saveProjectSelection };

export const load: PageServerLoad = ({ locals }) => {
	refreshProjects();
	const { workingOn, recentlySent, earlierSelected } = listActiveProjects();
	const rows = loadProjectProgressRows();
	const today = new Date().toISOString().slice(0, 10);
	const gradeSystems = getDisplayGradeSystems();
	const enrich = (project: (typeof workingOn)[number]) => ({
		...project,
		gradeLabel: formatClimbGrade(project, gradeSystems),
		progress: projectProgress(project, rows, today)
	});
	return {
		workingOn: workingOn.map(enrich),
		recentlySent: recentlySent.map(enrich),
		earlierSelected: earlierSelected.map(enrich),
		canManageProjects: locals.authed
	};
};
