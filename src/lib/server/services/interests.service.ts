// Interest page queries from Notion.
//
// Fetches child pages of the Interests parent page. Each child page
// (Poetry, Art, Music, Travel, Food) becomes /interests/[slug].
//
// Called by: routes/interests/[slug]/
// Depends on: notion.service.ts, notion-blocks.ts

import { env } from '$env/dynamic/private';
import type { ContentBlock } from '$lib/types/content';
import { getChildPages, getPageBlocks } from './notion.service';
import { transformBlocks } from './notion-blocks';

const MODULE = '[interests]';

/** An interest entry with its slug, title, and rendered content blocks. */
export interface InterestEntry {
	slug: string;
	title: string;
	blocks: ContentBlock[];
}

/** Converts a page title to a URL slug. */
function toSlug(title: string): string {
	return title.toLowerCase().replace(/\s+/g, '-');
}

/** Gets all interest slugs for static route generation (entries()). */
export async function getInterestSlugs(): Promise<string[]> {
	if (!env.NOTION_INTERESTS_PAGE_ID) {
		console.warn(`${MODULE} NOTION_INTERESTS_PAGE_ID not set`);
		return [];
	}

	const children = await getChildPages(env.NOTION_INTERESTS_PAGE_ID);
	return children.map((child) => toSlug(child.title));
}

/** Gets all interest entries with their content blocks. */
export async function getAllInterests(): Promise<InterestEntry[]> {
	if (!env.NOTION_INTERESTS_PAGE_ID) {
		console.warn(`${MODULE} NOTION_INTERESTS_PAGE_ID not set`);
		return [];
	}

	const children = await getChildPages(env.NOTION_INTERESTS_PAGE_ID);
	const entries: InterestEntry[] = [];

	for (const child of children) {
		const rawBlocks = await getPageBlocks(child.id);
		const blocks = await transformBlocks(rawBlocks);
		entries.push({
			slug: toSlug(child.title),
			title: child.title,
			blocks
		});
	}

	console.log(`${MODULE} loaded ${entries.length} interest pages`);
	return entries;
}

/** Gets a single interest entry by slug. */
export async function getInterestBySlug(slug: string): Promise<InterestEntry | null> {
	const all = await getAllInterests();
	return all.find((entry) => entry.slug === slug) ?? null;
}
