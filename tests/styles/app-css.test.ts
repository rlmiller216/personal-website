// File-shape tests for the section-heading nudge animation.
// Reads src/app.css as a string and asserts the keyframes, utility,
// hover override, and reduced-motion entry are all present.
//
// Why a string-shape test instead of a DOM render test:
// the project doesn't ship @testing-library/svelte, and the values we
// care about (keyframe percentages, animation duration, selector list)
// live entirely in CSS. fs.readFileSync + regex is enough.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_CSS = readFileSync(resolve('src/app.css'), 'utf8');

// Strip CSS comments so they can't satisfy a positive match.
const cssNoComments = APP_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

// Helper: extract a balanced { … } block starting at a given index.
function extractBlock(source: string, openIndex: number): string {
	let depth = 0;
	let i = openIndex;
	for (; i < source.length; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}') {
			depth--;
			if (depth === 0) return source.slice(openIndex, i + 1);
		}
	}
	throw new Error('unbalanced braces');
}

function findMediaBlock(condition: string): string {
	const re = new RegExp(`@media\\s*\\(\\s*${condition}\\s*\\)\\s*{`, 'i');
	const match = re.exec(cssNoComments);
	if (!match) throw new Error(`@media (${condition}) not found in app.css`);
	return extractBlock(cssNoComments, match.index + match[0].length - 1);
}

describe('app.css — section-heading nudge animation', () => {
	it('defines @keyframes nudgeX with rest at 0/70/100% and lean at 85%', () => {
		const re = /@keyframes\s+nudgeX\s*{/;
		const match = re.exec(cssNoComments);
		expect(match, '@keyframes nudgeX must be defined').toBeTruthy();
		const body = extractBlock(cssNoComments, match!.index + match![0].length - 1);
		expect(body).toMatch(/0%\s*,\s*70%\s*,\s*100%\s*{\s*transform:\s*translateX\(0\)/);
		expect(body).toMatch(/85%\s*{\s*transform:\s*translateX\(5px\)/);
	});

	it('defines .animate-nudge-x utility inside prefers-reduced-motion: no-preference', () => {
		const block = findMediaBlock('prefers-reduced-motion:\\s*no-preference');
		expect(block).toMatch(
			/\.animate-nudge-x\s*{\s*animation:\s*nudgeX\s+2s\s+ease-in-out\s+infinite/
		);
	});

	it('kills the nudge on hover/focus so group-hover:translate-x-2 owns the transform', () => {
		const block = findMediaBlock('prefers-reduced-motion:\\s*no-preference');
		// Two selectors (hover + focus-visible), animation: none in the body.
		expect(block).toMatch(/\.group:hover\s+\.animate-nudge-x/);
		expect(block).toMatch(/\.group:focus-visible\s+\.animate-nudge-x/);
		// Locate the rule body containing the override and assert animation: none.
		const ruleRe =
			/(\.group:hover\s+\.animate-nudge-x[^{]*|\.group:focus-visible\s+\.animate-nudge-x[^{]*)\s*{([^}]*)}/;
		const m = ruleRe.exec(block);
		expect(m, 'hover/focus override rule must exist').toBeTruthy();
		expect(m![2]).toMatch(/animation\s*:\s*none/);
	});

	it('disables .animate-nudge-x inside prefers-reduced-motion: reduce', () => {
		const block = findMediaBlock('prefers-reduced-motion:\\s*reduce');
		expect(block).toMatch(/\.animate-nudge-x/);
		expect(block).toMatch(/animation\s*:\s*none/);
	});
});
