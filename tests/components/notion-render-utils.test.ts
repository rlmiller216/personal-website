// Tests for Notion block render utilities.
//
// Verifies HTML rendering, XSS escaping, and content detection.

import { describe, it, expect } from 'vitest';
import { renderRichTextToSafeHtml, escapeHtml, hasContent } from '$lib/components/notion-render-utils';
import type { RichTextSpan } from '$lib/types/content';

const BASE_ANNOTATIONS = {
	bold: false,
	italic: false,
	strikethrough: false,
	underline: false,
	code: false,
	color: 'default'
};

function span(text: string, overrides?: Partial<RichTextSpan>): RichTextSpan {
	return { text, annotations: { ...BASE_ANNOTATIONS }, href: null, ...overrides };
}

describe('renderRichTextToSafeHtml', () => {
	it('renders bold annotation', () => {
		const result = renderRichTextToSafeHtml([span('hello', { annotations: { ...BASE_ANNOTATIONS, bold: true } })]);
		expect(result).toContain('<strong>hello</strong>');
	});

	it('renders italic annotation', () => {
		const result = renderRichTextToSafeHtml([span('world', { annotations: { ...BASE_ANNOTATIONS, italic: true } })]);
		expect(result).toContain('<em>world</em>');
	});

	it('renders code annotation', () => {
		const result = renderRichTextToSafeHtml([span('const x', { annotations: { ...BASE_ANNOTATIONS, code: true } })]);
		expect(result).toContain('<code');
		expect(result).toContain('const x</code>');
	});

	it('renders link with href', () => {
		const result = renderRichTextToSafeHtml([span('click', { href: 'https://example.com' })]);
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('target="_blank"');
		expect(result).toContain('>click</a>');
	});

	it('escapes XSS in script tags', () => {
		const result = renderRichTextToSafeHtml([span('<script>alert("xss")</script>')]);
		expect(result).not.toContain('<script>');
		expect(result).toContain('&lt;script&gt;');
	});

	it('renders nested bold + italic annotations', () => {
		const result = renderRichTextToSafeHtml([
			span('both', { annotations: { ...BASE_ANNOTATIONS, bold: true, italic: true } })
		]);
		expect(result).toContain('<strong>');
		expect(result).toContain('<em>');
		expect(result).toContain('both');
	});

	it('returns empty string for empty spans array', () => {
		expect(renderRichTextToSafeHtml([])).toBe('');
	});
});

describe('escapeHtml', () => {
	it('escapes &, <, >, " characters', () => {
		expect(escapeHtml('&<>"')).toBe('&amp;&lt;&gt;&quot;');
	});

	it('passes through safe text unchanged', () => {
		expect(escapeHtml('hello world')).toBe('hello world');
	});
});

describe('hasContent', () => {
	it('returns false for whitespace-only spans', () => {
		expect(hasContent([span('   '), span('\t')])).toBe(false);
	});

	it('returns true for spans with real text', () => {
		expect(hasContent([span('hello')])).toBe(true);
	});

	it('returns false for empty array', () => {
		expect(hasContent([])).toBe(false);
	});
});
