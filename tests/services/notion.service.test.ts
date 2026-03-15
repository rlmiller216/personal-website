// Tests for Notion property extractors.
//
// Tests the pure functions that extract typed values from Notion page properties.
// These don't call the API — they operate on mock PageObjectResponse shapes.

import { describe, it, expect } from 'vitest';
import {
	getTitle,
	getRichText,
	getSelect,
	getMultiSelect,
	getUrl,
	getCheckbox,
	getNumber,
	getFileUrl
} from '$lib/server/services/notion.service';

// --- Mock Helpers ---

function mockTitle(text: string) {
	return {
		id: 'title',
		type: 'title' as const,
		title: [{ type: 'text' as const, text: { content: text, link: null }, plain_text: text, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null }]
	};
}

function mockRichText(text: string) {
	return {
		id: 'rich_text',
		type: 'rich_text' as const,
		rich_text: [{ type: 'text' as const, text: { content: text, link: null }, plain_text: text, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null }]
	};
}

function mockSelect(name: string) {
	return {
		id: 'select',
		type: 'select' as const,
		select: { id: 'opt-1', name, color: 'default' as const, description: null }
	};
}

function mockMultiSelect(names: string[]) {
	return {
		id: 'multi_select',
		type: 'multi_select' as const,
		multi_select: names.map((name, i) => ({ id: `opt-${i}`, name, color: 'default' as const, description: null }))
	};
}

function mockUrl(url: string | null) {
	return { id: 'url', type: 'url' as const, url };
}

function mockCheckbox(checked: boolean) {
	return { id: 'checkbox', type: 'checkbox' as const, checkbox: checked };
}

function mockNumber(value: number | null) {
	return { id: 'number', type: 'number' as const, number: value };
}

function mockFiles(url: string, fileType: 'file' | 'external' = 'file') {
	const file = fileType === 'file'
		? { name: 'image.png', type: 'file' as const, file: { url, expiry_time: '2025-01-01T00:00:00.000Z' } }
		: { name: 'image.png', type: 'external' as const, external: { url } };
	return { id: 'files', type: 'files' as const, files: [file] };
}

// --- Tests ---

describe('getTitle', () => {
	it('extracts title text', () => {
		expect(getTitle(mockTitle('My Project'))).toBe('My Project');
	});

	it('returns empty string for empty title', () => {
		expect(getTitle({ id: 'title', type: 'title' as const, title: [] })).toBe('');
	});

	it('returns empty string for wrong property type', () => {
		expect(getTitle(mockCheckbox(true))).toBe('');
	});

	it('concatenates multi-span titles', () => {
		const prop = {
			id: 'title',
			type: 'title' as const,
			title: [
				{ type: 'text' as const, text: { content: 'Hello ', link: null }, plain_text: 'Hello ', annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null },
				{ type: 'text' as const, text: { content: 'World', link: null }, plain_text: 'World', annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null }
			]
		};
		expect(getTitle(prop)).toBe('Hello World');
	});
});

describe('getRichText', () => {
	it('extracts rich text', () => {
		expect(getRichText(mockRichText('Some description'))).toBe('Some description');
	});

	it('returns empty for wrong type', () => {
		expect(getRichText(mockTitle('title'))).toBe('');
	});
});

describe('getSelect', () => {
	it('extracts select value', () => {
		expect(getSelect(mockSelect('Food Tech'))).toBe('Food Tech');
	});

	it('returns empty for null select', () => {
		expect(getSelect({ id: 'select', type: 'select' as const, select: null })).toBe('');
	});

	it('returns empty for wrong type', () => {
		expect(getSelect(mockCheckbox(false))).toBe('');
	});
});

describe('getMultiSelect', () => {
	it('extracts multi-select values', () => {
		expect(getMultiSelect(mockMultiSelect(['Python', 'Biology']))).toEqual(['Python', 'Biology']);
	});

	it('returns empty array for empty multi-select', () => {
		expect(getMultiSelect(mockMultiSelect([]))).toEqual([]);
	});

	it('returns empty array for wrong type', () => {
		expect(getMultiSelect(mockTitle('test'))).toEqual([]);
	});
});

describe('getUrl', () => {
	it('extracts URL', () => {
		expect(getUrl(mockUrl('https://example.com'))).toBe('https://example.com');
	});

	it('returns empty for null URL', () => {
		expect(getUrl(mockUrl(null))).toBe('');
	});
});

describe('getCheckbox', () => {
	it('returns true for checked', () => {
		expect(getCheckbox(mockCheckbox(true))).toBe(true);
	});

	it('returns false for unchecked', () => {
		expect(getCheckbox(mockCheckbox(false))).toBe(false);
	});

	it('returns false for wrong type', () => {
		expect(getCheckbox(mockTitle('test'))).toBe(false);
	});
});

describe('getNumber', () => {
	it('extracts number', () => {
		expect(getNumber(mockNumber(42))).toBe(42);
	});

	it('returns 0 for null', () => {
		expect(getNumber(mockNumber(null))).toBe(0);
	});
});

describe('getFileUrl', () => {
	it('extracts internal file URL', () => {
		expect(getFileUrl(mockFiles('https://s3.aws.com/image.png', 'file'))).toBe('https://s3.aws.com/image.png');
	});

	it('extracts external file URL', () => {
		expect(getFileUrl(mockFiles('https://example.com/image.png', 'external'))).toBe('https://example.com/image.png');
	});

	it('returns empty for no files', () => {
		expect(getFileUrl({ id: 'files', type: 'files' as const, files: [] })).toBe('');
	});
});
