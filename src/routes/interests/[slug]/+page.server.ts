// Individual interest page — fetches content by slug.
//
// entries() is required by adapter-static to know which slugs to pre-render.

import { getInterestSlugs, getInterestBySlug } from '$lib/server/services/interests.service';
import { error } from '@sveltejs/kit';

export async function entries() {
	const slugs = await getInterestSlugs();
	return slugs.map((slug) => ({ slug }));
}

export async function load({ params }) {
	const entry = await getInterestBySlug(params.slug);

	if (!entry) {
		error(404, `Interest "${params.slug}" not found`);
	}

	return {
		title: entry.title,
		blocks: entry.blocks,
		slug: entry.slug
	};
}
