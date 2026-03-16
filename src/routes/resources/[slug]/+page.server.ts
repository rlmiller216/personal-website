import { error } from '@sveltejs/kit';
import { getAllResources, getResourceBySlug } from '$lib/server/services/resources.service';
import { getPageBlocks } from '$lib/server/services/notion.service';
import { transformBlocks } from '$lib/server/services/notion-blocks';

const MODULE = '[resource-detail]';

export async function entries() {
	const resources = await getAllResources();
	return resources.filter((r) => r.slug).map((r) => ({ slug: r.slug }));
}

export async function load({ params }) {
	const resource = await getResourceBySlug(params.slug);
	if (!resource) throw error(404, `Resource "${params.slug}" not found`);

	const rawBlocks = await getPageBlocks(resource.id);
	const blocks = await transformBlocks(rawBlocks);
	console.log(`${MODULE} "${resource.title}" — ${blocks.length} blocks`);

	return { resource, blocks };
}
