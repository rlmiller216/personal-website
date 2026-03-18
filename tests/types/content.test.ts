import { describe, test, expect } from 'vitest';
import { slugify, isVideoUrl } from '$lib/types/content';

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

describe('isVideoUrl', () => {
	test('returns true for .mp4 URLs', () => {
		expect(isVideoUrl('https://example.com/clip.mp4')).toBe(true);
	});
	test('returns true for .webm URLs', () => {
		expect(isVideoUrl('https://example.com/clip.webm')).toBe(true);
	});
	test('returns true for .mov URLs', () => {
		expect(isVideoUrl('https://example.com/clip.mov')).toBe(true);
	});
	test('returns true for local paths with video extensions', () => {
		expect(isVideoUrl('/images/abc123def456.mp4')).toBe(true);
	});
	test('returns false for image URLs', () => {
		expect(isVideoUrl('https://example.com/photo.jpg')).toBe(false);
		expect(isVideoUrl('https://example.com/photo.png')).toBe(false);
	});
	test('returns false for empty string', () => {
		expect(isVideoUrl('')).toBe(false);
	});
	test('ignores query params when checking extension', () => {
		expect(isVideoUrl('https://s3.aws.com/path/video.mp4?X-Amz-Expires=3600')).toBe(true);
	});
});
