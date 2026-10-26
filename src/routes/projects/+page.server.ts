import { listProjects, refreshProjects } from '#lib/server/projects';

export function load() {
	refreshProjects();
	return {
		open: listProjects('open'),
		sent: listProjects('sent')
	};
}
