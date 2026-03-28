// Transforms Notion API blocks into serializable ContentBlock[].
//
// Runs at build time in +page.server.ts. Handles:
// - Rich text extraction with annotations
// - Recursive child block fetching (toggles, toggle headings, nested lists)
// - Consecutive list item grouping into parent list blocks
// - Image URL extraction from both file and external sources
//
// Called by: about.service.ts, project/tool/resource detail routes
// Depends on: notion.service.ts for child block fetching, notion-block-utils.ts for shared helpers

import type { BlockObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import type { ContentBlock } from '$lib/types/content';
import { getChildBlocks } from './notion.service';
import { extractRichText, extractMediaUrl, createBaseBlock, groupListItems, parseWidthDirective } from './notion-block-utils';
import { getEmbedConfig } from './embed-config';
import { highlightCode } from './code-highlight';
import { downloadNotionImage, downloadNotionFile } from './image-cache';

/** Shared heading transform — handles both regular and toggleable headings. */
async function transformHeading(
	block: BlockObjectResponse,
	headingData: { rich_text: RichTextItemResponse[]; is_toggleable?: boolean },
	type: ContentBlock['type']
): Promise<ContentBlock> {
	const isToggleable = headingData.is_toggleable ?? false;
	return {
		...createBaseBlock(block.id),
		type,
		richText: extractRichText(headingData.rich_text),
		isToggleable,
		children: isToggleable && block.has_children
			? await fetchAndTransformChildren(block.id)
			: []
	};
}

/** Converts a single Notion block to a ContentBlock. */
async function blockToContentBlock(block: BlockObjectResponse): Promise<ContentBlock | null> {
	const base = createBaseBlock(block.id);

	switch (block.type) {
		case 'paragraph':
			return { ...base, type: 'paragraph', richText: extractRichText(block.paragraph.rich_text) };

		case 'heading_1': return transformHeading(block, block.heading_1, 'heading_1');
		case 'heading_2': return transformHeading(block, block.heading_2, 'heading_2');
		case 'heading_3': return transformHeading(block, block.heading_3, 'heading_3');
		// heading_4 is a recent Notion addition; cast needed until SDK types catch up
		case 'heading_4': return transformHeading(block, (block as never as { heading_4: { rich_text: RichTextItemResponse[]; is_toggleable?: boolean } }).heading_4, 'heading_4');

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

		case 'image': {
			const rawUrl = extractMediaUrl(block.image);
			const localUrl = await downloadNotionImage(rawUrl);
			const rawCaption = extractRichText(block.image.caption);
			const { width, caption } = parseWidthDirective(rawCaption);
			return { ...base, type: 'image', url: localUrl, caption, imageWidth: width };
		}

		case 'code': {
			const codeText = block.code.rich_text.map((r) => r.plain_text).join('');
			const highlighted = await highlightCode(codeText, block.code.language);
			return {
				...base,
				type: 'code',
				richText: extractRichText(block.code.rich_text),
				language: block.code.language,
				caption: extractRichText(block.code.caption),
				highlightedHtml: highlighted
			};
		}

		case 'bookmark':
			return {
				...base,
				type: 'bookmark',
				url: block.bookmark.url,
				caption: extractRichText(block.bookmark.caption)
			};

		case 'embed': {
			const embedUrl = block.embed.url;
			const embedConfig = getEmbedConfig(embedUrl);
			return {
				...base,
				type: 'embed',
				url: embedUrl,
				caption: extractRichText(block.embed.caption),
				embedType: embedConfig.provider,
				embedAspectRatio: embedConfig.aspectRatio,
				embedMinHeight: embedConfig.minHeight,
				embedLoading: embedConfig.loading
			};
		}

		case 'video': {
			const videoUrl = extractMediaUrl(block.video);
			const videoConfig = getEmbedConfig(videoUrl);
			// YouTube/Vimeo URLs should be embeds, not <video> tags
			if (videoConfig.provider === 'youtube' || videoConfig.provider === 'vimeo') {
				return {
					...base,
					type: 'embed',
					url: videoUrl,
					caption: extractRichText(block.video.caption),
					embedType: videoConfig.provider,
					embedAspectRatio: videoConfig.aspectRatio,
					embedMinHeight: videoConfig.minHeight,
					embedLoading: videoConfig.loading
				};
			}
			return {
				...base,
				type: 'video',
				url: videoUrl,
				caption: extractRichText(block.video.caption)
			};
		}

		case 'table': {
			const tableRows = await getChildBlocks(block.id);
			const rows = tableRows.map((row) => {
				const cells = (row as Record<string, unknown> & { table_row?: { cells: unknown[][] } })
					.table_row?.cells ?? [];
				return (cells as import('@notionhq/client/build/src/api-endpoints').RichTextItemResponse[][])
					.map((cell) => extractRichText(cell));
			});
			return {
				...base,
				type: 'table',
				rows,
				hasHeader: block.table.has_column_header
			};
		}

		case 'audio':
			return {
				...base,
				type: 'audio',
				url: extractMediaUrl(block.audio),
				caption: extractRichText(block.audio.caption)
			};

		case 'file': {
			const rawFileUrl = extractMediaUrl(block.file);
			const cachedFileUrl = await downloadNotionFile(rawFileUrl);
			return {
				...base,
				type: 'file',
				fileUrl: cachedFileUrl,
				fileName: block.file.caption?.length
					? extractRichText(block.file.caption).map((s) => s.text).join('')
					: block.file.name ?? 'Download file'
			};
		}

		case 'pdf': {
			const rawPdfUrl = extractMediaUrl(block.pdf);
			const cachedPdfUrl = await downloadNotionFile(rawPdfUrl);
			return {
				...base,
				type: 'pdf',
				fileUrl: cachedPdfUrl,
				fileName: block.pdf.caption?.length
					? extractRichText(block.pdf.caption).map((s) => s.text).join('')
					: 'Document.pdf',
				caption: extractRichText(block.pdf.caption)
			};
		}

		case 'column_list': {
			const columnBlocks = await getChildBlocks(block.id);
			const columns: ContentBlock[][] = [];
			// Fetch columns sequentially to avoid Notion API rate limits
			for (const col of columnBlocks) {
				const colChildren = await fetchAndTransformChildren(col.id);
				columns.push(colChildren);
			}
			console.log(`[notion-blocks] column_list: fetched ${columns.length} columns`);
			return { ...base, type: 'column_list', columns };
		}

		case 'synced_block': {
			const sourceId = block.synced_block.synced_from
				? block.synced_block.synced_from.block_id
				: block.id;
			const syncedChildren = await fetchAndTransformChildren(sourceId);
			return { ...base, type: 'synced_block', children: syncedChildren };
		}

		case 'equation':
			return { ...base, type: 'equation', expression: block.equation.expression };

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
