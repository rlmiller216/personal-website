// Open source tool queries and mapping from Notion database.
//
// Called by: routes/open-source/, routes/+page.server.ts (featured)
// Depends on: notion.service.ts for fetching, content.ts for types

import { env } from '$env/dynamic/private';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import type { Tool } from '$lib/types/content';
import {
	fetchAndMap,
	getTitle,
	getRichText,
	getSelect,
	getUrl,
	getMultiSelect,
	getCheckbox
} from './notion.service';

const MODULE = '[tools]';

function mapTool(page: PageObjectResponse): Tool {
	const props = page.properties;
	return {
		title: getTitle(props['Title']),
		description: getRichText(props['Description']),
		category: getSelect(props['Category']),
		githubUrl: getUrl(props['GitHub URL']),
		demoUrl: getUrl(props['Demo URL']),
		tags: getMultiSelect(props['Tags']),
		featured: getCheckbox(props['Featured'])
	};
}

export async function getAllTools(): Promise<Tool[]> {
	if (!env.NOTION_TOOLS_DS_ID) {
		console.warn(`${MODULE} env.NOTION_TOOLS_DS_ID not set`);
		return [];
	}

	return fetchAndMap(env.NOTION_TOOLS_DS_ID, mapTool);
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
