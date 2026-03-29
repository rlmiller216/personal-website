// Tests for the Notion block transformer.
//
// Tests transformBlocks() with mock BlockObjectResponse data.
// Verifies correct ContentBlock[] output for all supported block types
// and list grouping behavior.

import { describe, it, expect, vi } from 'vitest';

// Mock the notion.service module before importing notion-blocks
const mockGetChildBlocks = vi.fn().mockResolvedValue([]);
vi.mock('$lib/server/services/notion.service', () => ({
	getChildBlocks: mockGetChildBlocks
}));

// Mock Shiki code highlighting
const mockHighlightCode = vi.fn().mockResolvedValue('<pre class="shiki"><code>highlighted</code></pre>');
vi.mock('$lib/server/services/code-highlight', () => ({
	highlightCode: mockHighlightCode
}));

// Mock image cache — passthrough (returns URL unchanged)
vi.mock('$lib/server/services/image-cache', () => ({
	downloadNotionImage: vi.fn((url: string) => Promise.resolve(url)),
	downloadNotionFile: vi.fn((url: string) => Promise.resolve(url))
}));

// Mock image dimensions — returns fixed dimensions for local files
vi.mock('$lib/server/services/image-optimize', () => ({
	getImageDimensions: vi.fn(() => Promise.resolve({ width: 800, height: 600 }))
}));

const { transformBlocks } = await import('$lib/server/services/notion-blocks');

// --- Mock Helpers ---

function mockBlock(type: string, overrides: Record<string, unknown> = {}): Record<string, unknown> {
	const base = {
		id: `block-${Math.random().toString(36).slice(2, 8)}`,
		type,
		has_children: false,
		...overrides
	};

	return base;
}

function mockRichText(text: string) {
	return [{
		type: 'text',
		text: { content: text, link: null },
		plain_text: text,
		annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
		href: null
	}];
}

function paragraphBlock(text: string) {
	return mockBlock('paragraph', { paragraph: { rich_text: mockRichText(text) } });
}

function headingBlock(level: 1 | 2 | 3 | 4, text: string, isToggleable?: boolean) {
	const key = `heading_${level}`;
	const headingData: Record<string, unknown> = { rich_text: mockRichText(text) };
	if (isToggleable !== undefined) headingData.is_toggleable = isToggleable;
	return mockBlock(key, { [key]: headingData });
}

function bulletedListItem(text: string) {
	return mockBlock('bulleted_list_item', {
		bulleted_list_item: { rich_text: mockRichText(text) }
	});
}

function numberedListItem(text: string) {
	return mockBlock('numbered_list_item', {
		numbered_list_item: { rich_text: mockRichText(text) }
	});
}

function dividerBlock() {
	return mockBlock('divider', { divider: {} });
}

function imageBlock(url: string, caption: string = '') {
	return mockBlock('image', {
		image: {
			type: 'external',
			external: { url },
			caption: caption ? mockRichText(caption) : []
		}
	});
}

function codeBlock(text: string, language: string = 'typescript') {
	return mockBlock('code', {
		code: {
			rich_text: mockRichText(text),
			language,
			caption: []
		}
	});
}

function quoteBlock(text: string) {
	return mockBlock('quote', { quote: { rich_text: mockRichText(text) } });
}

function calloutBlock(text: string, emoji: string = '💡') {
	return mockBlock('callout', {
		callout: {
			rich_text: mockRichText(text),
			icon: { type: 'emoji', emoji }
		}
	});
}

// --- Tests ---

describe('transformBlocks', () => {
	it('transforms a paragraph block', async () => {
		const blocks = [paragraphBlock('Hello world')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('paragraph');
		expect(result[0].richText[0].text).toBe('Hello world');
	});

	it('transforms heading blocks', async () => {
		const blocks = [
			headingBlock(1, 'Main Title'),
			headingBlock(2, 'Section'),
			headingBlock(3, 'Subsection'),
			headingBlock(4, 'Detail')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(4);
		expect(result[0].type).toBe('heading_1');
		expect(result[0].richText[0].text).toBe('Main Title');
		expect(result[1].type).toBe('heading_2');
		expect(result[2].type).toBe('heading_3');
		expect(result[3].type).toBe('heading_4');
		expect(result[3].richText[0].text).toBe('Detail');
	});

	it('groups consecutive bulleted list items', async () => {
		const blocks = [
			bulletedListItem('Item 1'),
			bulletedListItem('Item 2'),
			bulletedListItem('Item 3')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('bulleted_list');
		expect(result[0].children).toHaveLength(3);
		expect(result[0].children[0].richText[0].text).toBe('Item 1');
		expect(result[0].children[2].richText[0].text).toBe('Item 3');
	});

	it('groups consecutive numbered list items', async () => {
		const blocks = [
			numberedListItem('Step 1'),
			numberedListItem('Step 2')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('numbered_list');
		expect(result[0].children).toHaveLength(2);
	});

	it('separates different list types', async () => {
		const blocks = [
			bulletedListItem('Bullet'),
			numberedListItem('Number')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(2);
		expect(result[0].type).toBe('bulleted_list');
		expect(result[1].type).toBe('numbered_list');
	});

	it('breaks list grouping on non-list blocks', async () => {
		const blocks = [
			bulletedListItem('Item 1'),
			paragraphBlock('Separator'),
			bulletedListItem('Item 2')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(3);
		expect(result[0].type).toBe('bulleted_list');
		expect(result[0].children).toHaveLength(1);
		expect(result[1].type).toBe('paragraph');
		expect(result[2].type).toBe('bulleted_list');
		expect(result[2].children).toHaveLength(1);
	});

	it('transforms a divider block', async () => {
		const blocks = [dividerBlock()];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('divider');
	});

	it('transforms an image block with caption', async () => {
		const blocks = [imageBlock('https://example.com/photo.jpg', 'A nice photo')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('image');
		expect(result[0].url).toBe('https://example.com/photo.jpg');
		expect(result[0].caption[0].text).toBe('A nice photo');
		// External URLs don't get dimensions (not cached locally)
		expect(result[0].imageNativeWidth).toBeUndefined();
		expect(result[0].imageNativeHeight).toBeUndefined();
	});

	it('reads native dimensions for locally cached images', async () => {
		const { downloadNotionImage } = await import('$lib/server/services/image-cache');
		(downloadNotionImage as ReturnType<typeof vi.fn>).mockResolvedValueOnce('/images/abc123.jpg');
		const blocks = [imageBlock('https://s3.amazonaws.com/notion/photo.jpg', 'Local image')];
		const result = await transformBlocks(blocks as never[]);

		expect(result[0].imageNativeWidth).toBe(800);
		expect(result[0].imageNativeHeight).toBe(600);
	});

	it('extracts [w:50] from image caption and sets imageWidth', async () => {
		const blocks = [imageBlock('https://example.com/photo.jpg', 'A photo [w:50]')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].imageWidth).toBe(50);
		expect(result[0].caption[0].text).toBe('A photo');
	});

	it('leaves imageWidth undefined when no directive in image caption', async () => {
		const blocks = [imageBlock('https://example.com/photo.jpg', 'Just a caption')];
		const result = await transformBlocks(blocks as never[]);

		expect(result[0].imageWidth).toBeUndefined();
		expect(result[0].caption[0].text).toBe('Just a caption');
	});

	it('transforms a code block with syntax highlighting', async () => {
		const blocks = [codeBlock('const x = 1;', 'javascript')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('code');
		expect(result[0].richText[0].text).toBe('const x = 1;');
		expect(result[0].language).toBe('javascript');
		expect(result[0].highlightedHtml).toBe('<pre class="shiki"><code>highlighted</code></pre>');
		expect(mockHighlightCode).toHaveBeenCalledWith('const x = 1;', 'javascript');
	});

	it('transforms a quote block', async () => {
		const blocks = [quoteBlock('To be or not to be')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('quote');
		expect(result[0].richText[0].text).toBe('To be or not to be');
	});

	it('transforms a callout block with emoji', async () => {
		const blocks = [calloutBlock('Important note', '⚠️')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('callout');
		expect(result[0].richText[0].text).toBe('Important note');
		expect(result[0].icon).toBe('⚠️');
	});

	it('skips unsupported block types', async () => {
		const blocks = [
			paragraphBlock('Keep this'),
			mockBlock('table_of_contents', { table_of_contents: {} }),
			paragraphBlock('And this')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(2);
		expect(result[0].richText[0].text).toBe('Keep this');
		expect(result[1].richText[0].text).toBe('And this');
	});

	it('handles mixed block types in sequence', async () => {
		const blocks = [
			headingBlock(1, 'Title'),
			paragraphBlock('Intro text'),
			bulletedListItem('Point 1'),
			bulletedListItem('Point 2'),
			dividerBlock(),
			imageBlock('https://example.com/img.png')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(5);
		expect(result[0].type).toBe('heading_1');
		expect(result[1].type).toBe('paragraph');
		expect(result[2].type).toBe('bulleted_list');
		expect(result[2].children).toHaveLength(2);
		expect(result[3].type).toBe('divider');
		expect(result[4].type).toBe('image');
	});

	it('handles empty block array', async () => {
		const result = await transformBlocks([]);
		expect(result).toEqual([]);
	});

	it('transforms embed with YouTube URL to smart embed', async () => {
		const blocks = [mockBlock('embed', {
			embed: { url: 'https://www.youtube.com/watch?v=abc123', caption: [] }
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('embed');
		expect(result[0].embedType).toBe('youtube');
		expect(result[0].embedAspectRatio).toBe('16/9');
	});

	it('converts video with YouTube URL to embed type', async () => {
		const blocks = [mockBlock('video', {
			video: {
				type: 'external',
				external: { url: 'https://youtu.be/abc123' },
				caption: mockRichText('A video')
			}
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('embed');
		expect(result[0].embedType).toBe('youtube');
		expect(result[0].url).toBe('https://youtu.be/abc123');
	});

	it('keeps video type for non-YouTube/Vimeo URLs', async () => {
		const blocks = [mockBlock('video', {
			video: {
				type: 'external',
				external: { url: 'https://example.com/video.mp4' },
				caption: []
			}
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('video');
		expect(result[0].url).toBe('https://example.com/video.mp4');
	});

	it('transforms table block with rows and header', async () => {
		mockGetChildBlocks.mockResolvedValueOnce([
			{ id: 'row-1', type: 'table_row', table_row: { cells: [mockRichText('Name'), mockRichText('Value')] } },
			{ id: 'row-2', type: 'table_row', table_row: { cells: [mockRichText('Foo'), mockRichText('42')] } }
		]);
		const blocks = [mockBlock('table', {
			table: { has_column_header: true, table_width: 2 }
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('table');
		expect(result[0].hasHeader).toBe(true);
		expect(result[0].rows).toHaveLength(2);
		expect(result[0].rows![0][0][0].text).toBe('Name');
		expect(result[0].rows![1][1][0].text).toBe('42');
	});

	it('transforms audio block', async () => {
		const blocks = [mockBlock('audio', {
			audio: {
				type: 'external',
				external: { url: 'https://example.com/song.mp3' },
				caption: mockRichText('A song')
			}
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('audio');
		expect(result[0].url).toBe('https://example.com/song.mp3');
		expect(result[0].caption[0].text).toBe('A song');
	});

	it('transforms file block', async () => {
		const blocks = [mockBlock('file', {
			file: {
				type: 'external',
				external: { url: 'https://example.com/doc.pdf' },
				caption: mockRichText('My document'),
				name: 'doc.pdf'
			}
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('file');
		expect(result[0].fileUrl).toBe('https://example.com/doc.pdf');
		expect(result[0].fileName).toBe('My document');
	});

	it('transforms pdf block', async () => {
		const blocks = [mockBlock('pdf', {
			pdf: {
				type: 'external',
				external: { url: 'https://example.com/paper.pdf' },
				caption: mockRichText('Research paper')
			}
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('pdf');
		expect(result[0].fileUrl).toBe('https://example.com/paper.pdf');
		expect(result[0].fileName).toBe('Research paper');
		expect(result[0].caption).toHaveLength(1);
	});

	it('transforms column_list block', async () => {
		// First call returns column blocks, subsequent calls return column children
		mockGetChildBlocks
			.mockResolvedValueOnce([
				{ id: 'col-1', type: 'column', has_children: true },
				{ id: 'col-2', type: 'column', has_children: true }
			])
			.mockResolvedValueOnce([
				{ id: 'p-1', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Col 1 text') } }
			])
			.mockResolvedValueOnce([
				{ id: 'p-2', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Col 2 text') } }
			]);
		const blocks = [mockBlock('column_list', {
			has_children: true
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('column_list');
		expect(result[0].columns).toHaveLength(2);
		expect(result[0].columns![0][0].richText[0].text).toBe('Col 1 text');
		expect(result[0].columns![1][0].richText[0].text).toBe('Col 2 text');
	});

	it('transforms synced_block with synced_from (reference)', async () => {
		mockGetChildBlocks.mockResolvedValueOnce([
			{ id: 'child-1', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Synced content') } }
		]);
		const blocks = [mockBlock('synced_block', {
			synced_block: { synced_from: { block_id: 'source-block-id' } }
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('synced_block');
		expect(result[0].children[0].richText[0].text).toBe('Synced content');
		expect(mockGetChildBlocks).toHaveBeenCalledWith('source-block-id');
	});

	it('transforms synced_block without synced_from (source)', async () => {
		mockGetChildBlocks.mockResolvedValueOnce([
			{ id: 'child-2', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Original content') } }
		]);
		const blocks = [mockBlock('synced_block', {
			id: 'self-block-id',
			synced_block: { synced_from: null }
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('synced_block');
		expect(result[0].children[0].richText[0].text).toBe('Original content');
	});

	it('transforms equation block', async () => {
		const blocks = [mockBlock('equation', {
			equation: { expression: 'E = mc^2' }
		})];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('equation');
		expect(result[0].expression).toBe('E = mc^2');
	});

	it('transforms toggle heading with children', async () => {
		mockGetChildBlocks.mockResolvedValueOnce([
			{ id: 'child-p', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Hidden content') } }
		]);
		const blocks = [headingBlock(2, 'Toggle Section', true)];
		// Mark has_children since the block has nested content
		(blocks[0] as Record<string, unknown>).has_children = true;
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_2');
		expect(result[0].isToggleable).toBe(true);
		expect(result[0].richText[0].text).toBe('Toggle Section');
		expect(result[0].children).toHaveLength(1);
		expect(result[0].children[0].richText[0].text).toBe('Hidden content');
	});

	it('transforms empty toggle heading (no children yet)', async () => {
		const blocks = [headingBlock(1, 'Empty Toggle', true)];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_1');
		expect(result[0].isToggleable).toBe(true);
		expect(result[0].children).toEqual([]);
	});

	it('treats heading with is_toggleable=false as regular heading', async () => {
		const blocks = [headingBlock(3, 'Normal Heading', false)];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_3');
		expect(result[0].isToggleable).toBe(false);
		expect(result[0].children).toEqual([]);
	});

	it('treats heading with undefined is_toggleable as non-toggleable', async () => {
		// headingBlock without isToggleable param omits the property entirely
		const blocks = [headingBlock(2, 'Legacy Heading')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_2');
		expect(result[0].isToggleable).toBe(false);
		expect(result[0].children).toEqual([]);
	});

	it('transforms toggle headings at all levels', async () => {
		mockGetChildBlocks
			.mockResolvedValueOnce([{ id: 'c1', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Child 1') } }])
			.mockResolvedValueOnce([{ id: 'c2', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Child 2') } }])
			.mockResolvedValueOnce([{ id: 'c3', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Child 3') } }])
			.mockResolvedValueOnce([{ id: 'c4', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('Child 4') } }]);

		const h1 = headingBlock(1, 'H1 Toggle', true);
		(h1 as Record<string, unknown>).has_children = true;
		const h2 = headingBlock(2, 'H2 Toggle', true);
		(h2 as Record<string, unknown>).has_children = true;
		const h3 = headingBlock(3, 'H3 Toggle', true);
		(h3 as Record<string, unknown>).has_children = true;
		const h4 = headingBlock(4, 'H4 Toggle', true);
		(h4 as Record<string, unknown>).has_children = true;

		const result = await transformBlocks([h1, h2, h3, h4] as never[]);

		expect(result).toHaveLength(4);
		for (const block of result) {
			expect(block.isToggleable).toBe(true);
			expect(block.children).toHaveLength(1);
		}
		expect(result[0].type).toBe('heading_1');
		expect(result[1].type).toBe('heading_2');
		expect(result[2].type).toBe('heading_3');
		expect(result[3].type).toBe('heading_4');
	});

	it('transforms toggle heading_4 with children', async () => {
		mockGetChildBlocks.mockResolvedValueOnce([
			{ id: 'child-h4', type: 'paragraph', has_children: false, paragraph: { rich_text: mockRichText('H4 hidden content') } }
		]);
		const blocks = [headingBlock(4, 'Toggle Detail', true)];
		(blocks[0] as Record<string, unknown>).has_children = true;
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_4');
		expect(result[0].isToggleable).toBe(true);
		expect(result[0].richText[0].text).toBe('Toggle Detail');
		expect(result[0].children).toHaveLength(1);
		expect(result[0].children[0].richText[0].text).toBe('H4 hidden content');
	});

	it('treats heading_4 with is_toggleable=false as regular heading', async () => {
		const blocks = [headingBlock(4, 'Plain H4', false)];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('heading_4');
		expect(result[0].isToggleable).toBe(false);
		expect(result[0].children).toEqual([]);
	});
});
