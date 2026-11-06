import { listActiveProjects, refreshProjects } from '#lib/server/projects';
import { loadProjectProgressRows } from '#lib/server/projectDetails';
import { projectProgress } from '#lib/server/projectProgress';

export function load() {
	refreshProjects();
	const { workingOn, recentlySent } = listActiveProjects();
	const rows = loadProjectProgressRows();
	const today = new Date().toISOString().slice(0, 10);
	const enrich = (project: (typeof workingOn)[number]) => ({
		...project,
		progress: projectProgress(project, rows, today)
	});
	return { workingOn: workingOn.map(enrich), recentlySent: recentlySent.map(enrich) };
}
