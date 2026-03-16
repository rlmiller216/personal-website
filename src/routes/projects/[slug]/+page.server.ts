import { error } from '@sveltejs/kit';
import { getAllProjects, getProjectBySlug } from '$lib/server/services/projects.service';
import { getPageContent } from '$lib/server/services/page-content';

const MODULE = '[project-detail]';

export async function entries() {
	const projects = await getAllProjects();
	return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
}

export async function load({ params }) {
	const project = await getProjectBySlug(params.slug);
	if (!project) throw error(404, `Project "${params.slug}" not found`);

	const blocks = await getPageContent(project.id);
	console.log(`${MODULE} "${project.title}" — ${blocks.length} blocks`);

	return { project, blocks };
}
