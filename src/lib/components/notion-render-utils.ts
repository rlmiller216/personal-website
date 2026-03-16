// Render utilities for Notion block Svelte components.
//
// ALL user text passes through escapeHtml() before annotation wrapping.
// Do NOT bypass escapeHtml for any input — XSS risk.
//
// Used by: NotionTextBlock.svelte, NotionMediaBlock.svelte
// Depends on: content.ts types only

import type { RichTextSpan } from '$lib/types/content';

/** Escapes HTML special characters to prevent XSS injection. */
export function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Renders RichTextSpan[] to sanitized HTML string safe for Svelte {@html}.
 * ALL user text passes through escapeHtml() before annotation wrapping.
 */
export function renderRichTextToSafeHtml(spans: RichTextSpan[]): string {
	return spans
		.map((span) => {
			let text = escapeHtml(span.text);

			if (span.annotations.code)
				text = `<code class="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`;
			if (span.annotations.bold) text = `<strong>${text}</strong>`;
			if (span.annotations.italic) text = `<em>${text}</em>`;
			if (span.annotations.strikethrough) text = `<s>${text}</s>`;
			if (span.annotations.underline) text = `<u>${text}</u>`;
			if (span.href)
				text = `<a href="${escapeHtml(span.href)}" class="text-primary underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity" target="_blank" rel="noopener noreferrer">${text}</a>`;

			return text;
		})
		.join('');
}

/** Returns true if any span contains non-whitespace text. */
export function hasContent(spans: RichTextSpan[]): boolean {
	return spans.some((s) => s.text.trim().length > 0);
}
