// Tests for warnSlugCollisions utility.
//
// Verifies that slug collision detection correctly warns on empty slugs
// and errors on duplicate slugs.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { warnSlugCollisions } from '$lib/server/services/notion.service';

afterEach(() => {
	vi.restoreAllMocks();
});

describe('warnSlugCollisions', () => {
	it('does not warn or error when there are no collisions', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: 'alpha', title: 'Alpha' },
			{ slug: 'beta', title: 'Beta' },
			{ slug: 'gamma', title: 'Gamma' }
		], '[test]');

		expect(warnSpy).not.toHaveBeenCalled();
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('warns on empty slug with item title', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: '', title: 'Untitled Draft' }
		], '[test]');

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('Untitled Draft');
		expect(warnSpy.mock.calls[0][0]).toContain('empty slug');
	});

	it('errors on duplicate slugs', () => {
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
		vi.spyOn(console, 'warn').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: 'my-project', title: 'My Project' },
			{ slug: 'other', title: 'Other' },
			{ slug: 'my-project', title: 'My Project Copy' }
		], '[test]');

		expect(errorSpy).toHaveBeenCalledOnce();
		expect(errorSpy.mock.calls[0][0]).toContain('my-project');
		expect(errorSpy.mock.calls[0][0]).toContain('DUPLICATE');
	});

	it('handles mix of empty and duplicate slugs', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: '', title: 'No Slug Item' },
			{ slug: 'dupe', title: 'First Dupe' },
			{ slug: 'dupe', title: 'Second Dupe' }
		], '[test]');

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(errorSpy).toHaveBeenCalledOnce();
	});

	it('only warns (no errors) when all slugs are empty', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: '', title: 'Draft A' },
			{ slug: '', title: 'Draft B' }
		], '[test]');

		expect(warnSpy).toHaveBeenCalledTimes(2);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('uses "(untitled)" fallback for empty title and empty slug', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		warnSlugCollisions([
			{ slug: '', title: '' }
		], '[test]');

		expect(warnSpy).toHaveBeenCalledOnce();
		expect(warnSpy.mock.calls[0][0]).toContain('(untitled)');
	});
});
