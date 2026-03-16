// Transforms Notion API blocks into serializable ContentBlock[].
//
// Runs at build time in +page.server.ts. Handles:
// - Rich text extraction with annotations
// - Recursive child block fetching (toggles, nested lists)
// - Consecutive list item grouping into parent list blocks
// - Image URL extraction from both file and external sources
//
// Called by: about.service.ts
// Depends on: notion.service.ts for child block fetching

import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { ContentBlock, RichTextSpan } from '$lib/types/content';
import { getChildBlocks } from './notion.service';

/** Converts Notion rich text items to our serializable RichTextSpan[]. */
function extractRichText(richTextItems: RichTextItemResponse[]): RichTextSpan[] {
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
		href: item.href
	}));
}

/** Extracts the image/video/file URL from a Notion block. */
function extractMediaUrl(
	media: { type: 'file'; file: { url: string } } | { type: 'external'; external: { url: string } }
): string {
	if (media.type === 'file') return media.file.url;
	if (media.type === 'external') return media.external.url;
	return '';
}

/** Converts a single Notion block to a ContentBlock. */
async function blockToContentBlock(block: BlockObjectResponse): Promise<ContentBlock | null> {
	const base: ContentBlock = {
		id: block.id,
		type: 'paragraph',
		richText: [],
		children: [],
		url: '',
		caption: [],
		language: '',
		checked: false,
		icon: ''
	};

	switch (block.type) {
		case 'paragraph':
			return { ...base, type: 'paragraph', richText: extractRichText(block.paragraph.rich_text) };

		case 'heading_1':
			return { ...base, type: 'heading_1', richText: extractRichText(block.heading_1.rich_text) };

		case 'heading_2':
			return { ...base, type: 'heading_2', richText: extractRichText(block.heading_2.rich_text) };

		case 'heading_3':
			return { ...base, type: 'heading_3', richText: extractRichText(block.heading_3.rich_text) };

		case 'bulleted_list_item':
			return {
				...base,
				type: 'bulleted_list_item',
				richText: extractRichText(block.bulleted_list_item.rich_text),
				children: block.has_children ? await fetchAndTransformChildren(block.id) : []
			};

		case 'numbered_list_item':
			return {
				...base,
				type: 'numbered_list_item',
				richText: extractRichText(block.numbered_list_item.rich_text),
				children: block.has_children ? await fetchAndTransformChildren(block.id) : []
			};

		case 'to_do':
			return {
				...base,
				type: 'to_do',
				richText: extractRichText(block.to_do.rich_text),
				checked: block.to_do.checked
			};

		case 'toggle':
			return {
				...base,
				type: 'toggle',
				richText: extractRichText(block.toggle.rich_text),
				children: block.has_children ? await fetchAndTransformChildren(block.id) : []
			};

		case 'quote':
			return { ...base, type: 'quote', richText: extractRichText(block.quote.rich_text) };

		case 'callout':
			return {
				...base,
				type: 'callout',
				richText: extractRichText(block.callout.rich_text),
				icon: block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : ''
			};

		case 'divider':
			return { ...base, type: 'divider' };

		case 'image':
			return {
				...base,
				type: 'image',
				url: extractMediaUrl(block.image),
				caption: extractRichText(block.image.caption)
			};

		case 'code':
			return {
				...base,
				type: 'code',
				richText: extractRichText(block.code.rich_text),
				language: block.code.language,
				caption: extractRichText(block.code.caption)
			};

		case 'bookmark':
			return {
				...base,
				type: 'bookmark',
				url: block.bookmark.url,
				caption: extractRichText(block.bookmark.caption)
			};

		case 'embed':
			return {
				...base,
				type: 'embed',
				url: block.embed.url,
				caption: extractRichText(block.embed.caption)
			};

		case 'video':
			return {
				...base,
				type: 'video',
				url: extractMediaUrl(block.video),
				caption: extractRichText(block.video.caption)
			};

		default:
			// Unsupported block type — skip silently
			return null;
	}
}

/** Recursively fetches and transforms child blocks. */
async function fetchAndTransformChildren(blockId: string): Promise<ContentBlock[]> {
	const childBlocks = await getChildBlocks(blockId);
	return transformBlocks(childBlocks);
}

/**
 * Groups consecutive list items into parent list blocks.
 *
 * Notion returns individual bulleted_list_item blocks without a parent <ul>.
 * This groups consecutive items of the same type into a synthetic
 * bulleted_list or numbered_list parent block.
 */
function groupListItems(blocks: ContentBlock[]): ContentBlock[] {
	const grouped: ContentBlock[] = [];
	let currentList: ContentBlock | null = null;

	for (const block of blocks) {
		if (block.type === 'bulleted_list_item') {
			if (!currentList || currentList.type !== 'bulleted_list') {
				currentList = {
					id: `list-${block.id}`,
					type: 'bulleted_list',
					richText: [],
					children: [],
					url: '',
					caption: [],
					language: '',
					checked: false,
					icon: ''
				};
				grouped.push(currentList);
			}
			currentList.children.push(block);
		} else if (block.type === 'numbered_list_item') {
			if (!currentList || currentList.type !== 'numbered_list') {
				currentList = {
					id: `list-${block.id}`,
					type: 'numbered_list',
					richText: [],
					children: [],
					url: '',
					caption: [],
					language: '',
					checked: false,
					icon: ''
				};
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

/**
 * Transforms Notion API blocks into serializable ContentBlock[].
 * Main entry point — handles conversion, children, and list grouping.
 */
export async function transformBlocks(blocks: BlockObjectResponse[]): Promise<ContentBlock[]> {
	const contentBlocks: ContentBlock[] = [];

	for (const block of blocks) {
		const converted = await blockToContentBlock(block);
		if (converted) {
			contentBlocks.push(converted);
		}
	}

	return groupListItems(contentBlocks);
}
