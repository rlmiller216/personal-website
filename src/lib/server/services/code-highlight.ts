// Server-side syntax highlighting via Shiki.
//
// Promise-cached singleton prevents race conditions during concurrent
// adapter-static builds. Single-theme (github-light) output — site is
// light-mode only.
//
// Used by: notion-blocks.ts when transforming code blocks
// Depends on: shiki

import { createHighlighter } from 'shiki';
import type { BundledLanguage, BundledTheme, HighlighterGeneric } from 'shiki';

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

// Promise-cached singleton — safe under concurrent load() calls
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
	if (highlighterPromise) return highlighterPromise;
	highlighterPromise = createHighlighter({
		themes: ['github-light'],
		langs: ['javascript', 'typescript', 'python', 'bash', 'json', 'html', 'css', 'plaintext']
	});
	return highlighterPromise;
}

/** Notion uses display names; Shiki uses identifiers. */
const LANGUAGE_MAP: Record<string, string> = {
	'plain text': 'plaintext',
	'c++': 'cpp',
	'c#': 'csharp',
	'objective-c': 'objc',
	'visual basic': 'vb',
	shell: 'bash',
	sh: 'bash'
};

/** Normalize Notion language name to Shiki language identifier. */
function mapLanguage(notionLanguage: string): string {
	const lower = notionLanguage.toLowerCase().trim();
	return LANGUAGE_MAP[lower] ?? lower;
}

/** Escape HTML entities for unhighlighted fallback. */
function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * Highlights code with single-theme Shiki output (github-light).
 * Falls back to escaped `<pre><code>` on error (unknown grammar, etc.).
 */
export async function highlightCode(code: string, notionLanguage: string): Promise<string> {
	const lang = mapLanguage(notionLanguage);

	try {
		const highlighter = await getHighlighter();
		// Dynamically load the language if not already loaded
		const loaded = highlighter.getLoadedLanguages();
		if (!loaded.includes(lang)) {
			try {
				await highlighter.loadLanguage(lang as BundledLanguage);
			} catch {
				console.warn(`[code-highlight] unknown language: "${notionLanguage}" (mapped to "${lang}"), using plaintext`);
				return `<pre><code>${escapeHtml(code)}</code></pre>`;
			}
		}

		return highlighter.codeToHtml(code, {
			lang,
			theme: 'github-light'
		});
	} catch (error) {
		console.warn(`[code-highlight] highlighting failed for "${notionLanguage}":`, error);
		return `<pre><code>${escapeHtml(code)}</code></pre>`;
	}
}
