// Tests for the Notion block transformer.
//
// Tests transformBlocks() with mock BlockObjectResponse data.
// Verifies correct ContentBlock[] output for all supported block types
// and list grouping behavior.

import { describe, it, expect, vi } from 'vitest';

// Mock the notion.service module before importing notion-blocks
vi.mock('$lib/server/services/notion.service', () => ({
	getChildBlocks: vi.fn().mockResolvedValue([])
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

function headingBlock(level: 1 | 2 | 3, text: string) {
	const key = `heading_${level}`;
	return mockBlock(key, { [key]: { rich_text: mockRichText(text) } });
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
			headingBlock(3, 'Subsection')
		];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(3);
		expect(result[0].type).toBe('heading_1');
		expect(result[0].richText[0].text).toBe('Main Title');
		expect(result[1].type).toBe('heading_2');
		expect(result[2].type).toBe('heading_3');
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
	});

	it('transforms a code block', async () => {
		const blocks = [codeBlock('const x = 1;', 'javascript')];
		const result = await transformBlocks(blocks as never[]);

		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('code');
		expect(result[0].richText[0].text).toBe('const x = 1;');
		expect(result[0].language).toBe('javascript');
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
});
