// Project queries and mapping from Notion database.
//
// Called by: routes/projects/, routes/+page.server.ts (featured)
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Project } from '$lib/types/content';
import {
	fetchAndMap,
	getTitle,
	getRichText,
	getSelect,
	getUrl,
	getCheckbox,
	getNumber,
	getFileUrl
} from './notion.service';

const MODULE = '[projects]';

function mapProject(page: PageObjectResponse): Project {
	const props = page.properties;
	return {
		title: getTitle(props['Title']),
		description: getRichText(props['Description']),
		sector: getSelect(props['Sector']),
		status: getSelect(props['Status']),
		role: getRichText(props['Role']),
		imageUrl: getFileUrl(props['Image']),
		url: getUrl(props['URL']),
		featured: getCheckbox(props['Featured']),
		order: getNumber(props['Order'])
	};
}

export async function getAllProjects(): Promise<Project[]> {
	if (!env.NOTION_PROJECTS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_PROJECTS_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_PROJECTS_DS_ID, mapProject, [
		{ property: 'Order', direction: 'ascending' }
	], {
		property: 'Status',
		select: { does_not_equal: 'Archived' }
	});
}

export async function getFeaturedProjects(): Promise<Project[]> {
	if (!env.NOTION_PROJECTS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_PROJECTS_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_PROJECTS_DS_ID, mapProject, [
		{ property: 'Order', direction: 'ascending' }
	], {
		property: 'Featured',
		checkbox: { equals: true }
	});
}
