// Open source tool queries and mapping from Notion database.
//
// Called by: routes/open-source/, routes/+page.server.ts (featured)
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Tool } from '$lib/types/content';
import { slugify } from '$lib/types/content';
import {
	fetchAndMap,
	createCachedFetcher,
	warnSlugCollisions,
	getTitle,
	getRichText,
	getSelect,
	getUrl,
	getMultiSelect,
	getCheckbox,
	getFileUrl
} from './notion.service';

const MODULE = '[tools]';

export function mapTool(page: PageObjectResponse): Tool {
	const props = page.properties;
	return {
		id: page.id,
		slug: slugify(getTitle(props['Title'])),
		title: getTitle(props['Title']),
		description: getRichText(props['Description']),
		category: getSelect(props['Category']),
		githubUrl: getUrl(props['GitHub URL']),
		demoUrl: getUrl(props['Demo URL']),
		tags: getMultiSelect(props['Tags']),
		featured: getCheckbox(props['Featured']),
		imageUrl: getFileUrl(props['Image'])
	};
}

export const getAllTools = createCachedFetcher(fetchAllTools);

async function fetchAllTools(): Promise<Tool[]> {
	if (!env.NOTION_TOOLS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_TOOLS_DS_ID not set`);
		return [];
	}

	const results = await fetchAndMap(env.NOTION_TOOLS_DS_ID, mapTool);

	warnSlugCollisions(results, MODULE);

	return results;
}

export async function getToolBySlug(slug: string): Promise<Tool | null> {
	const all = await getAllTools();
	return all.find(t => t.slug === slug) ?? null;
}

export async function getFeaturedTools(): Promise<Tool[]> {
	if (!env.NOTION_TOOLS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_TOOLS_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_TOOLS_DS_ID, mapTool, undefined, {
		property: 'Featured',
		checkbox: { equals: true }
	});
}
