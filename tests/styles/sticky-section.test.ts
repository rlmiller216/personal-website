// Regression guard for StickySection.svelte's invisible preconditions.
//
// position: sticky is fragile: any ancestor with overflow: hidden|auto|scroll
// silently breaks it, and `html { overflow-x: hidden }` breaks it on iOS
// Safari. These checks are file-shape assertions (no DOM render) — they read
// the source CSS + Svelte files as strings and fail CI if a future PR
// reintroduces a known sticky-killer.
//
// See StickySection.svelte for the full contract.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_CSS = readFileSync(resolve('src/app.css'), 'utf8');
const LAYOUT = readFileSync(resolve('src/routes/+layout.svelte'), 'utf8');
const HOMEPAGE = readFileSync(resolve('src/routes/+page.svelte'), 'utf8');

// Strip CSS / HTML comments so they can't satisfy a positive match or smuggle
// banned tokens past a negative match.
const cssNoComments = APP_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const layoutNoComments = LAYOUT.replace(/<!--[\s\S]*?-->/g, '');
const homepageNoComments = HOMEPAGE.replace(/<!--[\s\S]*?-->/g, '');

// Helper (mirrors tests/styles/app-css.test.ts): extract a balanced { … }
// block starting at a given index.
function extractBlock(source: string, openIndex: number): string {
	let depth = 0;
	for (let i = openIndex; i < source.length; i++) {
		if (source[i] === '{') depth++;
		else if (source[i] === '}') {
			depth--;
			if (depth === 0) return source.slice(openIndex, i + 1);
		}
	}
	throw new Error('unbalanced braces');
}

// Banned tokens on any ancestor of <StickySection>. overflow-x-clip is
// allowed because `clip` does not establish a scroll container.
const BANNED_OVERFLOW = [
	'overflow-hidden',
	'overflow-auto',
	'overflow-scroll',
	'overflow-y-hidden',
	'overflow-y-auto',
	'overflow-y-scroll',
	'overflow-x-hidden',
	'overflow-x-auto',
	'overflow-x-scroll'
];

describe('StickySection — foundation: html overflow', () => {
	it('html { … } uses overflow-x: clip, not overflow-x: hidden', () => {
		// Find the `html { … }` rule inside @layer base.
		const re = /\bhtml\s*{/;
		const match = re.exec(cssNoComments);
		expect(match, 'html { … } rule must exist in app.css').toBeTruthy();
		const body = extractBlock(cssNoComments, match!.index + match![0].length - 1);

		expect(
			body,
			'html must use overflow-x: clip — overflow-x: hidden makes <html> a scroll-port and breaks sticky on iOS'
		).toMatch(/overflow-x\s*:\s*clip/);
		expect(body).not.toMatch(/overflow-x\s*:\s*hidden/);
		expect(body).not.toMatch(/overflow-y\s*:\s*(hidden|auto|scroll)/);
		expect(body).not.toMatch(/overflow\s*:\s*(hidden|auto|scroll)/);
	});
});

describe('StickySection — layout ancestor chain', () => {
	it('no element wrapping <main> sets a clipping overflow', () => {
		// Pull every class="…" attribute out of +layout.svelte. Any of these
		// could be on an ancestor of <main> (and therefore of <StickySection>).
		// We're stricter than necessary: we forbid the banned tokens anywhere
		// in the layout's class attributes. The layout's only legitimate uses
		// of these tokens are on the slide-out sidebar nav (overflow-y-auto)
		// and inside other isolated overlays — but those panels are siblings
		// of <main>, not ancestors. If a future change moves them above <main>,
		// this test will catch it; refactor the layout instead of weakening
		// the test.
		//
		// Exception: the slide-out sidebar `overflow-y-auto` is allowed
		// because it's inside `<div class="hidden md:block">…</div>` and is a
		// sibling of <main>, not an ancestor. We narrow the scan to the wrapper
		// chain that actually wraps <main>.
		const mainIdx = layoutNoComments.indexOf('<main');
		expect(mainIdx, '<main> must exist in +layout.svelte').toBeGreaterThan(-1);

		// The wrapper chain is everything up to <main>, walking backwards from
		// <main> through opening tags. Easiest robust check: pull every class
		// attribute that appears BEFORE <main> in the file AND on a tag that
		// is still open at <main>'s position. As a tractable approximation,
		// scan all <div / <header / <body / <html opening tags before <main>
		// and check their class attributes.
		const before = layoutNoComments.slice(0, mainIdx);
		const wrapperOpenTagRe = /<(div|header|body|html|section|article|figure)\b[^>]*?>/gi;
		const wrapperClassRe = /class\s*=\s*"([^"]*)"/i;

		const offendingWrappers: string[] = [];
		for (const tagMatch of before.matchAll(wrapperOpenTagRe)) {
			const classMatch = wrapperClassRe.exec(tagMatch[0]);
			if (!classMatch) continue;
			const classes = classMatch[1];
			for (const banned of BANNED_OVERFLOW) {
				// Word boundary so `overflow-hidden` doesn't match `overflow-hidden-foo`.
				const wordRe = new RegExp(`\\b${banned}\\b`);
				if (wordRe.test(classes)) {
					offendingWrappers.push(`<${tagMatch[1]} class="${classes}"> contains "${banned}"`);
				}
			}
		}

		expect(
			offendingWrappers,
			`No ancestor of <main> in +layout.svelte may set a clipping overflow.\n` +
				`Offenders:\n  ${offendingWrappers.join('\n  ')}`
		).toEqual([]);

		// Also explicitly verify <main> itself is clean.
		const mainOpen = /<main\b[^>]*>/.exec(layoutNoComments);
		expect(mainOpen, '<main> opening tag must parse').toBeTruthy();
		const mainClassMatch = wrapperClassRe.exec(mainOpen![0]);
		if (mainClassMatch) {
			for (const banned of BANNED_OVERFLOW) {
				const wordRe = new RegExp(`\\b${banned}\\b`);
				expect(
					wordRe.test(mainClassMatch[1]),
					`<main> must not carry "${banned}" — it would clip every StickySection`
				).toBe(false);
			}
		}
	});
});

describe('StickySection — homepage ancestor chain', () => {
	it('no element wrapping <StickySection> sets a clipping overflow', () => {
		// Walk every <StickySection occurrence and verify each enclosing tag
		// up to (but not including) sibling sections is overflow-clean.
		// Approximation: scan every opening tag before each <StickySection
		// instance and check its classes. Sibling siblings of <StickySection>
		// (like the hero <section data-hero …overflow-hidden>) are filtered
		// out because they CLOSE before <StickySection> opens.
		const stickyOccurrences: number[] = [];
		const stickyRe = /<StickySection\b/g;
		let m: RegExpExecArray | null;
		while ((m = stickyRe.exec(homepageNoComments)) !== null) {
			stickyOccurrences.push(m.index);
		}
		expect(stickyOccurrences.length, '+page.svelte must use <StickySection>').toBeGreaterThan(0);

		// For each StickySection, walk backwards counting open vs. close tags
		// to find the chain of currently-open ancestors.
		const tagRe = /<(\/?)([A-Za-z][A-Za-z0-9]*)\b([^>]*)>/g;
		const offenders: string[] = [];

		for (const stickyIdx of stickyOccurrences) {
			const stack: { tag: string; classes: string }[] = [];
			tagRe.lastIndex = 0;
			let tm: RegExpExecArray | null;
			while ((tm = tagRe.exec(homepageNoComments)) !== null && tm.index < stickyIdx) {
				const isClose = tm[1] === '/';
				const tag = tm[2];
				const attrs = tm[3];
				// Self-closing void / Svelte-shorthand tags: skip ones that close
				// themselves on the same tag (`<br/>`, `<img …/>` etc.).
				const selfCloses = /\/\s*$/.test(attrs);
				if (isClose) {
					// Pop the most recent matching open.
					for (let i = stack.length - 1; i >= 0; i--) {
						if (stack[i].tag === tag) {
							stack.splice(i, 1);
							break;
						}
					}
				} else if (!selfCloses) {
					const classMatch = /class\s*=\s*"([^"]*)"/i.exec(attrs);
					stack.push({ tag, classes: classMatch ? classMatch[1] : '' });
				}
			}

			// Every entry left on the stack is an ancestor of this StickySection.
			for (const ancestor of stack) {
				for (const banned of BANNED_OVERFLOW) {
					const wordRe = new RegExp(`\\b${banned}\\b`);
					if (wordRe.test(ancestor.classes)) {
						offenders.push(
							`StickySection at index ${stickyIdx}: ancestor <${ancestor.tag} class="${ancestor.classes}"> contains "${banned}"`
						);
					}
				}
			}
		}

		expect(
			offenders,
			`No ancestor of <StickySection> in +page.svelte may set a clipping overflow.\n` +
				`Offenders:\n  ${offenders.join('\n  ')}`
		).toEqual([]);
	});
});
