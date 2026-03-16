// Tests for Shiki code highlighting utility.
//
// Mocks Shiki to avoid loading real WASM grammars in tests.
// Verifies language mapping, fallback behavior, and singleton caching.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Track how many times createHighlighter is called to verify singleton
let createCount = 0;
const mockHighlighter = {
	codeToHtml: vi.fn().mockReturnValue('<pre class="shiki"><code>highlighted</code></pre>'),
	getLoadedLanguages: vi.fn().mockReturnValue(['javascript', 'typescript', 'python', 'plaintext']),
	loadLanguage: vi.fn().mockResolvedValue(undefined)
};

vi.mock('shiki', () => ({
	createHighlighter: vi.fn(() => {
		createCount++;
		return Promise.resolve(mockHighlighter);
	})
}));

const { highlightCode } = await import('$lib/server/services/code-highlight');

describe('highlightCode', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('highlights code with a known language', async () => {
		const result = await highlightCode('const x = 1;', 'javascript');

		expect(result).toContain('shiki');
		expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith('const x = 1;', {
			lang: 'javascript',
			themes: { light: 'github-light', dark: 'github-dark' },
			defaultColor: false
		});
	});

	it('maps Notion language names to Shiki identifiers', async () => {
		await highlightCode('echo hello', 'shell');

		expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
			'echo hello',
			expect.objectContaining({ lang: 'bash' })
		);
	});

	it('maps "Plain Text" case-insensitively', async () => {
		await highlightCode('just text', 'Plain Text');

		expect(mockHighlighter.codeToHtml).toHaveBeenCalledWith(
			'just text',
			expect.objectContaining({ lang: 'plaintext' })
		);
	});

	it('falls back to escaped HTML for unknown languages', async () => {
		mockHighlighter.getLoadedLanguages.mockReturnValueOnce([]);
		mockHighlighter.loadLanguage.mockRejectedValueOnce(new Error('Unknown lang'));

		const result = await highlightCode('x = <tag>', 'obscurelang');

		expect(result).toBe('<pre><code>x = &lt;tag&gt;</code></pre>');
	});

	it('returns same highlighter instance on concurrent calls', async () => {
		const before = createCount;
		await Promise.all([
			highlightCode('a', 'javascript'),
			highlightCode('b', 'typescript')
		]);
		// Singleton: createHighlighter should not be called again
		expect(createCount - before).toBe(0);
	});

	it('escapes HTML entities in fallback output', async () => {
		mockHighlighter.codeToHtml.mockImplementationOnce(() => {
			throw new Error('shiki error');
		});

		const result = await highlightCode('<div class="x">&</div>', 'html');

		expect(result).toBe('<pre><code>&lt;div class=&quot;x&quot;&gt;&amp;&lt;/div&gt;</code></pre>');
	});
});
