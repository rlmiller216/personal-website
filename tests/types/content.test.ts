import { describe, test, expect } from 'vitest';
import { slugify } from '$lib/types/content';

describe('slugify', () => {
	test('converts title to lowercase kebab-case', () => {
		expect(slugify('Steak: Made from Plants')).toBe('steak-made-from-plants');
	});
	test('strips leading and trailing hyphens', () => {
		expect(slugify('--hello--')).toBe('hello');
	});
	test('collapses multiple non-alphanumeric chars', () => {
		expect(slugify('AI & ML --- Tools')).toBe('ai-ml-tools');
	});
	test('handles empty string', () => {
		expect(slugify('')).toBe('');
	});
	test('handles unicode by stripping non-alphanumeric', () => {
		expect(slugify('Café Résumé')).toBe('caf-r-sum');
	});
});
