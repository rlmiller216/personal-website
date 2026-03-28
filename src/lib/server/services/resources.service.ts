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
	getCheckbox,
	getNumber,
	getMediaFiles
} from './notion.service';
import { downloadItemMedia } from './image-cache';

const MODULE = '[resources]';

export function mapResource(page: PageObjectResponse): Resource {
	const props = page.properties;
	const media = getMediaFiles(props['Image']);
	return {
		id: page.id,
		slug: slugify(getTitle(props['Title'])),
		title: getTitle(props['Title']),
		description: getRichText(props['Description']),
		type: getSelect(props['Type']),
		category: getSelect(props['Category']),
		status: getSelect(props['Status']),
		author: getRichText(props['Author']),
		url: getUrl(props['URL']),
		whyILoveIt: getRichText(props['Why I Love It']),
		imageUrl: media.mediaUrl,
		isVideo: false,
		posterUrl: media.posterUrl,
		order: getNumber(props['Order']),
		featured: getCheckbox(props['Featured'])
	};
}

export const getAllResources = createCachedFetcher(fetchAllResources);

async function fetchAllResources(): Promise<Resource[]> {
	if (!env.NOTION_RESOURCES_DS_ID) {
		console.warn(`${MODULE} env.NOTION_RESOURCES_DS_ID not set`);
		return [];
	}

	const results = await fetchAndMap(env.NOTION_RESOURCES_DS_ID, mapResource, [
		{ property: 'Order', direction: 'ascending' }
	], {
		property: 'Status',
		select: { does_not_equal: 'Archived' }
	});

	warnSlugCollisions(results, MODULE);
	await downloadItemMedia(results);

	return results;
}

export async function getFeaturedResources(): Promise<Resource[]> {
	const all = await getAllResources();
	return all.filter(r => r.featured);
}

export async function getResourceBySlug(slug: string): Promise<Resource | null> {
	const all = await getAllResources();
	return all.find(r => r.slug === slug) ?? null;
}
