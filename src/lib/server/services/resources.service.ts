// Resource queries and mapping from Notion database.
//
// Called by: routes/resources/, routes/+page.server.ts
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Resource } from '$lib/types/content';
import { slugify } from '$lib/types/content';
import {
	fetchAndMap,
	createCachedFetcher,
	warnSlugCollisions,
	getTitle,
	getRichText,
	getSelect,
	getUrl,
	getFileUrl
} from './notion.service';

const MODULE = '[resources]';

export function mapResource(page: PageObjectResponse): Resource {
	const props = page.properties;
	return {
		id: page.id,
		slug: slugify(getTitle(props['Title'])),
		title: getTitle(props['Title']),
		description: '',
		type: getSelect(props['Type']),
		category: getSelect(props['Category']),
		author: getRichText(props['Author']),
		url: getUrl(props['URL']),
		whyILoveIt: getRichText(props['Why I Love It']),
		imageUrl: getFileUrl(props['Image'])
	};
}

/** Groups resources by their Type property (Book, Website, Podcast, etc.). */
export function groupByType(resources: Resource[]): Record<string, Resource[]> {
	const groups: Record<string, Resource[]> = {};
	for (const resource of resources) {
		const type = resource.type || 'Other';
		if (!groups[type]) groups[type] = [];
		groups[type].push(resource);
	}
	return groups;
}

export const getAllResources = createCachedFetcher(fetchAllResources);

async function fetchAllResources(): Promise<Resource[]> {
	if (!env.NOTION_RESOURCES_DS_ID) {
		console.warn(`${MODULE} env.NOTION_RESOURCES_DS_ID not set`);
		return [];
	}

	const results = await fetchAndMap(env.NOTION_RESOURCES_DS_ID, mapResource);

	warnSlugCollisions(results, MODULE);

	return results;
}

export async function getResourceBySlug(slug: string): Promise<Resource | null> {
	const all = await getAllResources();
	return all.find(r => r.slug === slug) ?? null;
}
