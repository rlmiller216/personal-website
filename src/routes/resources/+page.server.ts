// Resources listing — fetches all resources and groups by type.

import { getAllResources, groupByType } from '$lib/server/services/resources.service';

export async function load() {
	const resources = await getAllResources();
	const grouped = groupByType(resources);
	return { grouped };
}
