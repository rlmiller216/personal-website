// About page content from Notion.
//
// Fetches a single Notion page and transforms its blocks
// into serializable ContentBlock[] for Svelte rendering.
//
// Called by: routes/about/+page.server.ts
// Depends on: notion.service.ts, notion-blocks.ts

import { env } from '$env/dynamic/private';
import type { ContentBlock } from '$lib/types/content';
import { getPageContent } from './page-content';

const MODULE = '[about]';

export async function getAboutContent(): Promise<ContentBlock[]> {
	if (!env.NOTION_ABOUT_PAGE_ID) {
		console.warn(`${MODULE} env.NOTION_ABOUT_PAGE_ID not set`);
		return [];
	}

	try {
		const blocks = await getPageContent(env.NOTION_ABOUT_PAGE_ID);
		console.log(`${MODULE} loaded ${blocks.length} content blocks`);
		return blocks;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`${MODULE} failed to load about content — ${message}`);
		return [];
	}
}
