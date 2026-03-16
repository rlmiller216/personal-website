// Homepage server load — fetches featured items from all Notion databases.
//
// Provides featured projects, tools, and resources for the homepage sections.

import { env } from '$env/dynamic/private';
import { getFeaturedProjects } from '$lib/server/services/projects.service';
import { getFeaturedTools } from '$lib/server/services/tools.service';
import { getAllResources } from '$lib/server/services/resources.service';

export async function load() {
	const [projects, tools, allResources] = await Promise.all([
		getFeaturedProjects(),
		getFeaturedTools(),
		getAllResources()
	]);

	return {
		featuredProjects: projects,
		featuredTools: tools,
		// Show first 4 resources on homepage
		featuredResources: allResources.slice(0, 4),
		heroHeadline: env.RM_HERO_HEADLINE || 'Science for the greater good',
		heroIntro: env.RM_HERO_INTRO || ''
	};
}
