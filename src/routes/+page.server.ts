// Homepage server load — fetches featured items from all Notion databases.
//
// Provides featured projects, tools, and resources for the homepage sections.

import { env } from '$env/dynamic/private';
import { getFeaturedProjects } from '$lib/server/services/projects.service';
import { getFeaturedTools } from '$lib/server/services/tools.service';
import { getAllResources } from '$lib/server/services/resources.service';

const MAX_FEATURED_RESOURCES = 4;

export async function load() {
	const [projects, tools, allResources] = await Promise.all([
		getFeaturedProjects(),
		getFeaturedTools(),
		getAllResources()
	]);

	return {
		featuredProjects: projects,
		featuredTools: tools,
		featuredResources: allResources.slice(0, MAX_FEATURED_RESOURCES),
		heroHeadline: env.RM_HERO_HEADLINE || 'Science for the Greater Good',
		heroIntro: env.RM_HERO_INTRO || ''
	};
}
