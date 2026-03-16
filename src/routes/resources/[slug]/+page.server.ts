import { error } from '@sveltejs/kit';
import { getAllResources, getResourceBySlug } from '$lib/server/services/resources.service';
import { getPageContent } from '$lib/server/services/page-content';

const MODULE = '[resource-detail]';

export async function entries() {
	const resources = await getAllResources();
	return resources.filter((r) => r.slug).map((r) => ({ slug: r.slug }));
}

export async function load({ params }) {
	const resource = await getResourceBySlug(params.slug);
	if (!resource) throw error(404, `Resource "${params.slug}" not found`);

	const blocks = await getPageContent(resource.id);
	console.log(`${MODULE} "${resource.title}" — ${blocks.length} blocks`);

	return { resource, blocks };
}
