import { error } from '@sveltejs/kit';
import { getAllTools, getToolBySlug } from '$lib/server/services/tools.service';
import { getPageContent } from '$lib/server/services/page-content';

const MODULE = '[tool-detail]';

export async function entries() {
	const tools = await getAllTools();
	return tools.filter((t) => t.slug).map((t) => ({ slug: t.slug }));
}

export async function load({ params }) {
	const tool = await getToolBySlug(params.slug);
	if (!tool) throw error(404, `Tool "${params.slug}" not found`);

	const blocks = await getPageContent(tool.id);
	console.log(`${MODULE} "${tool.title}" — ${blocks.length} blocks`);

	return { tool, blocks };
}
