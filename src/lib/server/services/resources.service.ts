// Resource queries and mapping from Notion database.
//
// Called by: routes/resources/, routes/+page.server.ts
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Resource } from '$lib/types/content';
import {
	fetchAndMap,
	getTitle,
	getRichText,
	getSelect,
	getUrl,
	getFileUrl
} from './notion.service';

const MODULE = '[resources]';

function mapResource(page: PageObjectResponse): Resource {
	const props = page.properties;
	return {
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

export async function getAllResources(): Promise<Resource[]> {
	if (!env.NOTION_RESOURCES_DS_ID) {
		console.warn(`${MODULE} env.NOTION_RESOURCES_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_RESOURCES_DS_ID, mapResource);
}
