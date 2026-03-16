import { error } from '@sveltejs/kit';
import { getAllProjects, getProjectBySlug } from '$lib/server/services/projects.service';
import { getPageBlocks } from '$lib/server/services/notion.service';
import { transformBlocks } from '$lib/server/services/notion-blocks';

const MODULE = '[project-detail]';

export async function entries() {
	const projects = await getAllProjects();
	return projects.filter((p) => p.slug).map((p) => ({ slug: p.slug }));
}

export async function load({ params }) {
	const project = await getProjectBySlug(params.slug);
	if (!project) throw error(404, `Project "${params.slug}" not found`);

	const rawBlocks = await getPageBlocks(project.id);
	const blocks = await transformBlocks(rawBlocks);
	console.log(`${MODULE} "${project.title}" — ${blocks.length} blocks`);

	return { project, blocks };
}
