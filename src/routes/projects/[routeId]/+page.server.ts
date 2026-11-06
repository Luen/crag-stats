import { error } from '@sveltejs/kit';
import { getProjectDetails } from '#lib/server/projectDetails';
import { refreshProjects } from '#lib/server/projects';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params, locals }) => {
	if (!/^[1-9]\d*$/.test(params.routeId)) error(404, 'Project not found');
	refreshProjects();
	const details = getProjectDetails(Number(params.routeId));
	if (!details) error(404, 'Project not found');
	return { ...details, canManageProjects: locals.authed };
};
