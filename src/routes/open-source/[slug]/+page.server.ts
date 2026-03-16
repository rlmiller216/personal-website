import { error } from '@sveltejs/kit';
import { getAllTools, getToolBySlug } from '$lib/server/services/tools.service';
import { getPageBlocks } from '$lib/server/services/notion.service';
import { transformBlocks } from '$lib/server/services/notion-blocks';

const MODULE = '[tool-detail]';

export async function entries() {
	const tools = await getAllTools();
	return tools.filter((t) => t.slug).map((t) => ({ slug: t.slug }));
}

export async function load({ params }) {
	const tool = await getToolBySlug(params.slug);
	if (!tool) throw error(404, `Tool "${params.slug}" not found`);

	const rawBlocks = await getPageBlocks(tool.id);
	const blocks = await transformBlocks(rawBlocks);
	console.log(`${MODULE} "${tool.title}" — ${blocks.length} blocks`);

	return { tool, blocks };
}
