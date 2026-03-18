// Resources listing — fetches all resources ordered by Order column.

import { getAllResources } from '$lib/server/services/resources.service';

export async function load() {
	const resources = await getAllResources();
	return { resources };
}
