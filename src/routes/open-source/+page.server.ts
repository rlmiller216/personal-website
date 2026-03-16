// Open Source listing — fetches all tools from Notion.

import { getAllTools } from '$lib/server/services/tools.service';

export async function load() {
	const tools = await getAllTools();
	return { tools };
}
