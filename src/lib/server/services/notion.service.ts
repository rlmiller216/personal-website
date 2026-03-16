// Notion API client, property extractors, and generic fetcher.
//
// The single source of truth for all Notion interactions.
// Uses v5 API: dataSources.query() instead of databases.query().
// Called by: projects.service.ts, tools.service.ts, resources.service.ts, etc.
// Depends on: @notionhq/client, env vars for API key and data source IDs

import { Client } from '@notionhq/client';
import { env } from '$env/dynamic/private';
import type {
	PageObjectResponse,
	BlockObjectResponse,
	QueryDataSourceParameters
} from '@notionhq/client/build/src/api-endpoints';

const MODULE = '[notion]';

// --- Client ---

function createClient(): Client | null {
	if (!env.NOTION_API_KEY) {
		console.warn(`${MODULE} NOTION_API_KEY not set — Notion features disabled`);
		return null;
	}
	return new Client({ auth: env.NOTION_API_KEY });
}

let notionClient: Client | null = null;

function getClient(): Client | null {
	if (!notionClient) {
		notionClient = createClient();
	}
	return notionClient;
}

// --- Property Extractors ---
// Each extracts a typed value from a Notion page property.
// Uses the Notion SDK's discriminated union types — no `any`.

type PageProperty = PageObjectResponse['properties'][string];

export function getTitle(property: PageProperty | undefined): string {
	if (!property || property.type !== 'title') return '';
	return property.title.map((t) => t.plain_text).join('');
}

export function getRichText(property: PageProperty | undefined): string {
	if (!property || property.type !== 'rich_text') return '';
	return property.rich_text.map((t) => t.plain_text).join('');
}

export function getSelect(property: PageProperty | undefined): string {
	if (!property || property.type !== 'select') return '';
	return property.select?.name ?? '';
}

export function getMultiSelect(property: PageProperty | undefined): string[] {
	if (!property || property.type !== 'multi_select') return [];
	return property.multi_select.map((s) => s.name);
}

/** Extract from either select or multi_select — always returns string[].
 *  Handles Notion DB schema changes without silent data loss. */
export function getSelectOrMulti(property: PageProperty | undefined): string[] {
	if (!property) return [];
	if (property.type === 'multi_select') {
		return property.multi_select.map((s) => s.name);
	}
	if (property.type === 'select' && property.select?.name) {
		return [property.select.name];
	}
	return [];
}

export function getUrl(property: PageProperty | undefined): string {
	if (!property || property.type !== 'url') return '';
	return property.url ?? '';
}

export function getCheckbox(property: PageProperty | undefined): boolean {
	if (!property || property.type !== 'checkbox') return false;
	return property.checkbox;
}

export function getNumber(property: PageProperty | undefined): number {
	if (!property || property.type !== 'number') return 0;
	return property.number ?? 0;
}

export function getFileUrl(property: PageProperty | undefined): string {
	if (!property || property.type !== 'files') return '';
	const file = property.files[0];
	if (!file) return '';
	if (file.type === 'file') return file.file.url;
	if (file.type === 'external') return file.external.url;
	return '';
}

// --- Generic Fetcher ---

/**
 * Queries all pages from a Notion data source with automatic pagination.
 * Uses v5 API: dataSources.query() with data_source_id.
 */
export async function queryAllPages(
	dataSourceId: string,
	sorts?: QueryDataSourceParameters['sorts'],
	filter?: QueryDataSourceParameters['filter']
): Promise<PageObjectResponse[]> {
	const notion = getClient();
	if (!notion) return [];

	const pages: PageObjectResponse[] = [];
	let cursor: string | undefined = undefined;

	try {
		do {
			const response = await notion.dataSources.query({
				data_source_id: dataSourceId,
				sorts,
				filter,
				start_cursor: cursor,
				page_size: 100
			});

			for (const page of response.results) {
				if ('properties' in page) {
					pages.push(page as PageObjectResponse);
				}
			}

			cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
		} while (cursor);

		console.log(`${MODULE} queried ${dataSourceId}: ${pages.length} pages`);
		return pages;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`${MODULE} failed to query data source ${dataSourceId} — ${message}`);
		return [];
	}
}

/**
 * Fetches all pages from a data source and maps each through a typed mapper.
 * This is the primary interface — services call this, not queryAllPages directly.
 */
export async function fetchAndMap<T>(
	dataSourceId: string,
	mapper: (page: PageObjectResponse) => T,
	sorts?: QueryDataSourceParameters['sorts'],
	filter?: QueryDataSourceParameters['filter']
): Promise<T[]> {
	const pages = await queryAllPages(dataSourceId, sorts, filter);
	return pages.map(mapper);
}

// --- Page Block Fetcher ---

/**
 * Fetches all blocks from a Notion page with automatic pagination.
 * Used by about.service.ts for rich content pages.
 */
export async function getPageBlocks(pageId: string): Promise<BlockObjectResponse[]> {
	const notion = getClient();
	if (!notion) return [];

	const blocks: BlockObjectResponse[] = [];
	let cursor: string | undefined = undefined;

	try {
		do {
			const response = await notion.blocks.children.list({
				block_id: pageId,
				start_cursor: cursor,
				page_size: 100
			});

			for (const block of response.results) {
				if ('type' in block) {
					blocks.push(block as BlockObjectResponse);
				}
			}

			cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
		} while (cursor);

		console.log(`${MODULE} fetched blocks for ${pageId}: ${blocks.length} blocks`);
		return blocks;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`${MODULE} failed to fetch blocks for ${pageId} — ${message}`);
		return [];
	}
}

/**
 * Fetches child blocks of a specific block (for nested content like toggles).
 */
export async function getChildBlocks(blockId: string): Promise<BlockObjectResponse[]> {
	return getPageBlocks(blockId);
}

/**
 * Fetches child pages of a parent page.
 * Fetches child pages of a parent Notion page.
 */
export async function getChildPages(
	parentId: string
): Promise<Array<{ id: string; title: string }>> {
	const notion = getClient();
	if (!notion) return [];

	try {
		const blocks = await getPageBlocks(parentId);
		const childPages: Array<{ id: string; title: string }> = [];

		for (const block of blocks) {
			if (block.type === 'child_page') {
				childPages.push({
					id: block.id,
					title: block.child_page.title
				});
			}
		}

		console.log(`${MODULE} found ${childPages.length} child pages under ${parentId}`);
		return childPages;
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`${MODULE} failed to get child pages for ${parentId} — ${message}`);
		return [];
	}
}

/** Creates a promise-based cached getter — safe under concurrent adapter-static load() calls. */
export function createCachedFetcher<T>(fetcher: () => Promise<T[]>): () => Promise<T[]> {
	let cachePromise: Promise<T[]> | null = null;
	return () => {
		if (cachePromise) return cachePromise;
		cachePromise = fetcher();
		return cachePromise;
	};
}

/** Logs warnings for empty slugs and errors for duplicates. */
export function warnSlugCollisions(
	items: Array<{ slug: string; title: string }>,
	module: string
): void {
	const slugs = new Set<string>();
	for (const item of items) {
		if (!item.slug) {
			console.warn(`${module} item "${item.title || '(untitled)'}" has empty slug — skipping detail page`);
			continue;
		}
		if (slugs.has(item.slug)) {
			console.error(`${module} DUPLICATE SLUG "${item.slug}" — detail pages will overwrite. Rename in Notion.`);
		}
		slugs.add(item.slug);
	}
}
