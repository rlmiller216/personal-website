// About page — fetches content from a single Notion page.

import { getAboutContent } from '$lib/server/services/about.service';

export async function load() {
	const blocks = await getAboutContent();
	return { blocks };
}
