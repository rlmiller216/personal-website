// Shared utilities for Notion block transformation.
//
// Extracted from notion-blocks.ts to keep files focused and enable
// reuse by future block handlers without circular imports.
//
// Used by: notion-blocks.ts
// Depends on: content.ts types only

import type { RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { ContentBlock, RichTextSpan } from '$lib/types/content';

/** Matches Notion internal page links: /<32 hex chars> with optional query/fragment. */
const NOTION_PAGE_HREF = /^\/[0-9a-f]{32}\b/;

/** Rewrites Notion internal page links to external Notion URLs. */
function normalizeHref(href: string | null): string | null {
	if (!href) return null;
	if (NOTION_PAGE_HREF.test(href)) return `https://notion.so${href}`;
	return href;
}

/** Converts Notion rich text items to our serializable RichTextSpan[]. */
export function extractRichText(richTextItems: RichTextItemResponse[]): RichTextSpan[] {
	return richTextItems.map((item) => ({
		text: item.plain_text,
		annotations: {
			bold: item.annotations.bold,
			italic: item.annotations.italic,
			strikethrough: item.annotations.strikethrough,
			underline: item.annotations.underline,
			code: item.annotations.code,
			color: item.annotations.color
		},
		href: normalizeHref(item.href)
	}));
}

/** Extracts the image/video/file URL from a Notion block. */
export function extractMediaUrl(
	media: { type: 'file'; file: { url: string } } | { type: 'external'; external: { url: string } }
): string {
	if (media.type === 'file') return media.file.url;
	if (media.type === 'external') return media.external.url;
	return '';
}

/** Creates a base ContentBlock with default values. */
export function createBaseBlock(id: string): ContentBlock {
	return {
		id,
		type: 'paragraph',
		richText: [],
		children: [],
		url: '',
		caption: [],
		language: '',
		checked: false,
		icon: ''
	};
}

/**
 * Groups consecutive list items into parent list blocks.
 *
 * Notion returns individual bulleted_list_item blocks without a parent <ul>.
 * This groups consecutive items of the same type into a synthetic
 * bulleted_list or numbered_list parent block.
 */
export function groupListItems(blocks: ContentBlock[]): ContentBlock[] {
	const grouped: ContentBlock[] = [];
	let currentList: ContentBlock | null = null;

	for (const block of blocks) {
		if (block.type === 'bulleted_list_item') {
			if (!currentList || currentList.type !== 'bulleted_list') {
				currentList = createBaseBlock(`list-${block.id}`);
				currentList.type = 'bulleted_list';
				grouped.push(currentList);
			}
			currentList.children.push(block);
		} else if (block.type === 'numbered_list_item') {
			if (!currentList || currentList.type !== 'numbered_list') {
				currentList = createBaseBlock(`list-${block.id}`);
				currentList.type = 'numbered_list';
				grouped.push(currentList);
			}
			currentList.children.push(block);
		} else {
			currentList = null;
			grouped.push(block);
		}
	}

	return grouped;
}
