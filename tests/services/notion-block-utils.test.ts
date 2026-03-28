// Tests for Notion block transformation utilities.
//
// Verifies rich text extraction, media URL extraction,
// base block creation, and list item grouping.

import { describe, it, expect } from 'vitest';
import { extractRichText, extractMediaUrl, createBaseBlock, groupListItems, parseWidthDirective } from '$lib/server/services/notion-block-utils';
import type { ContentBlock, RichTextSpan } from '$lib/types/content';

describe('extractRichText', () => {
	it('extracts text and annotations from rich text items', () => {
		const items = [{
			plain_text: 'hello',
			annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const },
			href: null,
			type: 'text' as const,
			text: { content: 'hello', link: null }
		}];
		const result = extractRichText(items);
		expect(result).toHaveLength(1);
		expect(result[0].text).toBe('hello');
		expect(result[0].annotations.bold).toBe(true);
		expect(result[0].annotations.italic).toBe(false);
	});

	it('preserves href on linked text', () => {
		const items = [{
			plain_text: 'link',
			annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const },
			href: 'https://example.com',
			type: 'text' as const,
			text: { content: 'link', link: { url: 'https://example.com' } }
		}];
		const result = extractRichText(items);
		expect(result[0].href).toBe('https://example.com');
	});

	it('rewrites Notion internal page links to external URLs', () => {
		const items = [{
			plain_text: 'linked page',
			annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const },
			href: '/325e5dbc4add80388b3ed2a90dbaba81',
			type: 'text' as const,
			text: { content: 'linked page', link: { url: '/325e5dbc4add80388b3ed2a90dbaba81' } }
		}];
		const result = extractRichText(items);
		expect(result[0].href).toBe('https://notion.so/325e5dbc4add80388b3ed2a90dbaba81');
	});
});

describe('extractMediaUrl', () => {
	it('extracts URL from file type', () => {
		expect(extractMediaUrl({ type: 'file', file: { url: 'https://s3.aws/img.png' } })).toBe('https://s3.aws/img.png');
	});

	it('extracts URL from external type', () => {
		expect(extractMediaUrl({ type: 'external', external: { url: 'https://cdn.com/img.png' } })).toBe('https://cdn.com/img.png');
	});

	it('returns empty string for unknown type', () => {
		// Force an unknown type to test the fallback
		const media = { type: 'unknown' } as unknown as Parameters<typeof extractMediaUrl>[0];
		expect(extractMediaUrl(media)).toBe('');
	});
});

describe('createBaseBlock', () => {
	it('returns correct shape with default values', () => {
		const block = createBaseBlock('test-id');
		expect(block.id).toBe('test-id');
		expect(block.type).toBe('paragraph');
		expect(block.richText).toEqual([]);
		expect(block.children).toEqual([]);
		expect(block.url).toBe('');
		expect(block.caption).toEqual([]);
		expect(block.language).toBe('');
		expect(block.checked).toBe(false);
		expect(block.icon).toBe('');
	});
});

describe('groupListItems', () => {
	function makeBlock(id: string, type: ContentBlock['type']): ContentBlock {
		return { ...createBaseBlock(id), type };
	}

	it('groups consecutive bulleted items into a bulleted_list', () => {
		const blocks = [makeBlock('a', 'bulleted_list_item'), makeBlock('b', 'bulleted_list_item')];
		const result = groupListItems(blocks);
		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('bulleted_list');
		expect(result[0].children).toHaveLength(2);
	});

	it('groups consecutive numbered items into a numbered_list', () => {
		const blocks = [makeBlock('a', 'numbered_list_item'), makeBlock('b', 'numbered_list_item')];
		const result = groupListItems(blocks);
		expect(result).toHaveLength(1);
		expect(result[0].type).toBe('numbered_list');
		expect(result[0].children).toHaveLength(2);
	});

	it('breaks groups when a non-list item appears', () => {
		const blocks = [
			makeBlock('a', 'bulleted_list_item'),
			makeBlock('b', 'paragraph'),
			makeBlock('c', 'bulleted_list_item')
		];
		const result = groupListItems(blocks);
		expect(result).toHaveLength(3);
		expect(result[0].type).toBe('bulleted_list');
		expect(result[1].type).toBe('paragraph');
		expect(result[2].type).toBe('bulleted_list');
	});

	it('passes through non-list blocks unchanged', () => {
		const blocks = [makeBlock('a', 'paragraph'), makeBlock('b', 'heading_1')];
		const result = groupListItems(blocks);
		expect(result).toHaveLength(2);
		expect(result[0].type).toBe('paragraph');
		expect(result[1].type).toBe('heading_1');
	});
});

function span(text: string): RichTextSpan {
	return {
		text,
		annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' },
		href: null
	};
}

describe('parseWidthDirective', () => {
	it('extracts [w:50] and returns width 50', () => {
		const result = parseWidthDirective([span('A photo [w:50]')]);
		expect(result.width).toBe(50);
		expect(result.caption[0].text).toBe('A photo');
	});

	it('handles space in directive [w: 30]', () => {
		const result = parseWidthDirective([span('Caption [w: 30]')]);
		expect(result.width).toBe(30);
		expect(result.caption[0].text).toBe('Caption');
	});

	it('returns undefined width when no directive present', () => {
		const result = parseWidthDirective([span('Just a caption')]);
		expect(result.width).toBeUndefined();
		expect(result.caption[0].text).toBe('Just a caption');
	});

	it('strips directive from middle of caption and collapses spaces', () => {
		const result = parseWidthDirective([span('Before [w:40] after')]);
		expect(result.width).toBe(40);
		expect(result.caption[0].text).toBe('Before after');
	});

	it('handles empty caption array', () => {
		const result = parseWidthDirective([]);
		expect(result.width).toBeUndefined();
		expect(result.caption).toEqual([]);
	});

	it('is case-insensitive', () => {
		expect(parseWidthDirective([span('[W:60]')]).width).toBe(60);
	});

	it('handles directive-only caption (empty after strip)', () => {
		const result = parseWidthDirective([span('[w:50]')]);
		expect(result.width).toBe(50);
		expect(result.caption[0].text).toBe('');
	});

	it('finds directive in a later span of multi-span caption', () => {
		const result = parseWidthDirective([span('A photo'), span(' [w:50]')]);
		expect(result.width).toBe(50);
		expect(result.caption[0].text).toBe('A photo');
		expect(result.caption[1].text).toBe('');
	});
});
