// Project queries and mapping from Notion database.
//
// Called by: routes/projects/, routes/+page.server.ts (featured)
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Project } from '$lib/types/content';
import { slugify } from '$lib/types/content';
import {
	fetchAndMap,
	createCachedFetcher,
	warnSlugCollisions,
	getTitle,
	getRichText,
	getSelect,
	getMultiSelect,
	getUrl,
	getCheckbox,
	getNumber,
	getFileUrl
} from './notion.service';

const MODULE = '[projects]';

export function mapProject(page: PageObjectResponse): Project {
	const props = page.properties;
	return {
		id: page.id,
		slug: slugify(getTitle(props['Title'])),
		title: getTitle(props['Title']),
		description: getRichText(props['Description']),
		sector: getSelect(props['Sector']),
		status: getSelect(props['Status']),
		role: getRichText(props['Role']),
		imageUrl: getFileUrl(props['Image']),
		url: getUrl(props['URL']),
		featured: getCheckbox(props['Featured']),
		order: getNumber(props['Order']),
		tags: getMultiSelect(props['Tags'])
	};
}

export const getAllProjects = createCachedFetcher(fetchAllProjects);

async function fetchAllProjects(): Promise<Project[]> {
	if (!env.NOTION_PROJECTS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_PROJECTS_DS_ID not set`);
		return [];
	}

	const results = await fetchAndMap(env.NOTION_PROJECTS_DS_ID, mapProject, [
		{ property: 'Order', direction: 'ascending' }
	], {
		property: 'Status',
		select: { does_not_equal: 'Archived' }
	});

	warnSlugCollisions(results, MODULE);

	return results;
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
	const all = await getAllProjects();
	return all.find(p => p.slug === slug) ?? null;
}

export async function getFeaturedProjects(): Promise<Project[]> {
	if (!env.NOTION_PROJECTS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_PROJECTS_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_PROJECTS_DS_ID, mapProject, [
		{ property: 'Order', direction: 'ascending' }
	], {
		and: [
			{ property: 'Featured', checkbox: { equals: true } },
			{ property: 'Status', select: { does_not_equal: 'Archived' } }
		]
	});
}
