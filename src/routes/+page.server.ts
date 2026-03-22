// Homepage server load — fetches featured items from all Notion databases.
//
// Provides featured projects, tools, and resources for the homepage sections.

import { env } from '$env/dynamic/private';
import { getFeaturedProjects } from '$lib/server/services/projects.service';
import { getFeaturedTools } from '$lib/server/services/tools.service';
import { getFeaturedResources } from '$lib/server/services/resources.service';

export async function load() {
	const [projects, tools, featuredResources] = await Promise.all([
		getFeaturedProjects(),
		getFeaturedTools(),
		getFeaturedResources()
	]);

	return {
		featuredProjects: projects,
		featuredTools: tools,
		featuredResources,
		heroHeadline: env.RM_HERO_HEADLINE || 'Science for the Greater Good',
		heroIntro: env.RM_HERO_INTRO || ''
	};
}
