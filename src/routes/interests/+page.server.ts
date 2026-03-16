// Interests index — redirects to the first interest or shows a list.

import { getAllInterests } from '$lib/server/services/interests.service';

export async function load() {
	const interests = await getAllInterests();
	return {
		interests: interests.map((i) => ({ slug: i.slug, title: i.title }))
	};
}
