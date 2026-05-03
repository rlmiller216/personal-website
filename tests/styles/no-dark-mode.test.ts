// Invariant guards: this site is light-mode only.
//
// These tests fail if anyone re-introduces dark mode in any form —
// CSS selectors, Tailwind variants, the prefers-color-scheme bootstrap,
// or the ThemeToggle component. They are the contract that "no dark mode"
// is enforceable, not aspirational.

import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const APP_CSS = readFileSync(resolve('src/app.css'), 'utf8');
const APP_HTML = readFileSync(resolve('src/app.html'), 'utf8');

function walk(dir: string, exts: string[]): string[] {
	const out: string[] = [];
	for (const entry of readdirSync(dir)) {
		const full = join(dir, entry);
		if (statSync(full).isDirectory()) {
			out.push(...walk(full, exts));
		} else if (exts.some((ext) => full.endsWith(ext))) {
			out.push(full);
		}
	}
	return out;
}

describe('app.css — no dark mode', () => {
	it('contains no .dark { … } selector block', () => {
		expect(APP_CSS).not.toMatch(/^\s*\.dark\s*{/m);
	});

	it('contains no @custom-variant dark directive', () => {
		expect(APP_CSS).not.toMatch(/@custom-variant\s+dark/);
	});

	it('contains no html.dark selector', () => {
		expect(APP_CSS).not.toMatch(/html\.dark/);
	});
});

describe('app.html — no theme bootstrap', () => {
	it('does not read prefers-color-scheme', () => {
		expect(APP_HTML).not.toMatch(/prefers-color-scheme/);
	});

	it('does not read theme from localStorage', () => {
		expect(APP_HTML).not.toMatch(/localStorage\.getItem\(\s*['"]theme['"]/);
	});

	it('does not add the dark class to documentElement', () => {
		expect(APP_HTML).not.toMatch(/classList\.add\(\s*['"]dark['"]/);
	});
});

describe('src tree — no dark mode references', () => {
	const sourceFiles = walk(resolve('src'), ['.svelte', '.ts', '.css']);

	it('finds at least one source file (sanity)', () => {
		expect(sourceFiles.length).toBeGreaterThan(0);
	});

	it('uses no Tailwind dark: variant utilities', () => {
		const offenders: string[] = [];
		for (const file of sourceFiles) {
			const content = readFileSync(file, 'utf8');
			if (/\bdark:[a-z]/.test(content)) {
				offenders.push(file);
			}
		}
		expect(offenders, `dark: utilities found in: ${offenders.join(', ')}`).toEqual([]);
	});

	it('does not import ThemeToggle', () => {
		const offenders: string[] = [];
		for (const file of sourceFiles) {
			const content = readFileSync(file, 'utf8');
			if (/ThemeToggle/.test(content)) {
				offenders.push(file);
			}
		}
		expect(offenders, `ThemeToggle reference found in: ${offenders.join(', ')}`).toEqual([]);
	});
});
