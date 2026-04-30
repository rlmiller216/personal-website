import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('+layout.svelte header', () => {
	it('does not render ThemeToggle in the header (only in slide-out panel)', () => {
		const src = readFileSync(
			resolve(__dirname, '../../src/routes/+layout.svelte'),
			'utf-8'
		);
		const headerMatch = src.match(/<header[\s\S]*?<\/header>/);
		expect(headerMatch).not.toBeNull();
		expect(headerMatch![0]).not.toContain('<ThemeToggle');
	});
});
