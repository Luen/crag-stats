import { listActiveProjects, refreshProjects } from '#lib/server/projects';

export function load() {
	refreshProjects();
	const { workingOn, recentlySent } = listActiveProjects();
	return { workingOn, recentlySent };
}
