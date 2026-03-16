// Projects listing — fetches all non-archived projects from Notion.

import { getAllProjects } from '$lib/server/services/projects.service';

export async function load() {
	const projects = await getAllProjects();
	return { projects };
}
