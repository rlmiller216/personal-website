// Tests for service mapper functions (mapProject, mapTool, mapResource).
//
// Verifies that each mapper correctly transforms a PageObjectResponse into
// its domain type, including graceful defaults for missing properties.

import { describe, it, expect } from 'vitest';
import { mapProject } from '$lib/server/services/projects.service';
import { mapTool } from '$lib/server/services/tools.service';
import { mapResource } from '$lib/server/services/resources.service';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

// --- Mock Helpers ---

function mockTitle(text: string) {
	return {
		id: 'title',
		type: 'title' as const,
		title: text
			? [{ type: 'text' as const, text: { content: text, link: null }, plain_text: text, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null }]
			: []
	};
}

function mockRichText(text: string) {
	return {
		id: 'rich_text',
		type: 'rich_text' as const,
		rich_text: text
			? [{ type: 'text' as const, text: { content: text, link: null }, plain_text: text, annotations: { bold: false, italic: false, strikethrough: false, underline: false, code: false, color: 'default' as const }, href: null }]
			: []
	};
}

function mockSelect(name: string) {
	return {
		id: 'select',
		type: 'select' as const,
		select: name ? { id: 'opt-1', name, color: 'default' as const, description: null } : null
	};
}

function mockMultiSelect(names: string[]) {
	return {
		id: 'multi_select',
		type: 'multi_select' as const,
		multi_select: names.map((name, i) => ({ id: `opt-${i}`, name, color: 'default' as const, description: null }))
	};
}

function mockUrl(url: string | null) {
	return { id: 'url', type: 'url' as const, url };
}

function mockCheckbox(checked: boolean) {
	return { id: 'checkbox', type: 'checkbox' as const, checkbox: checked };
}

function mockNumber(value: number | null) {
	return { id: 'number', type: 'number' as const, number: value };
}

function mockFiles(url: string) {
	return {
		id: 'files',
		type: 'files' as const,
		files: url
			? [{ name: 'image.png', type: 'file' as const, file: { url, expiry_time: '2025-01-01T00:00:00.000Z' } }]
			: []
	};
}

/** Builds a minimal PageObjectResponse with given properties. */
function makePage(id: string, properties: Record<string, unknown>): PageObjectResponse {
	return {
		id,
		object: 'page',
		created_time: '2025-01-01T00:00:00.000Z',
		last_edited_time: '2025-01-01T00:00:00.000Z',
		archived: false,
		in_trash: false,
		url: `https://notion.so/${id}`,
		public_url: null,
		parent: { type: 'database_id', database_id: 'db-1' },
		icon: null,
		cover: null,
		properties,
		created_by: { object: 'user', id: 'user-1' },
		last_edited_by: { object: 'user', id: 'user-1' }
	} as unknown as PageObjectResponse;
}

// --- mapProject ---

describe('mapProject', () => {
	it('maps complete properties correctly', () => {
		const page = makePage('proj-1', {
			'Title': mockTitle('Gene Editing Platform'),
			'Description': mockRichText('CRISPR-based tool'),
			'Sector': mockSelect('AI for Science'),
			'Status': mockSelect('Active'),
			'Role': mockRichText('Lead Scientist'),
			'Image': mockFiles('https://s3.aws.com/cover.png'),
			'URL': mockUrl('https://example.com/project'),
			'Featured': mockCheckbox(true),
			'Order': mockNumber(3),
			'Tags': mockMultiSelect(['Biotech', 'Food Science'])
		});

		const result = mapProject(page);

		expect(result.id).toBe('proj-1');
		expect(result.title).toBe('Gene Editing Platform');
		expect(result.slug).toBe('gene-editing-platform');
		expect(result.description).toBe('CRISPR-based tool');
		expect(result.sector).toEqual(['AI for Science']);
		expect(result.status).toBe('Active');
		expect(result.role).toBe('Lead Scientist');
		expect(result.imageUrl).toBe('https://s3.aws.com/cover.png');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.url).toBe('https://example.com/project');
		expect(result.featured).toBe(true);
		expect(result.order).toBe(3);
		expect(result.tags).toEqual(['Biotech', 'Food Science']);
	});

	it('returns graceful defaults for missing optional properties', () => {
		const page = makePage('proj-2', {
			'Title': mockTitle('Minimal Project')
		});

		const result = mapProject(page);

		expect(result.id).toBe('proj-2');
		expect(result.title).toBe('Minimal Project');
		expect(result.slug).toBe('minimal-project');
		expect(result.description).toBe('');
		expect(result.sector).toEqual([]);
		expect(result.status).toBe('');
		expect(result.role).toBe('');
		expect(result.imageUrl).toBe('');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.url).toBe('');
		expect(result.featured).toBe(false);
		expect(result.order).toBe(0);
		expect(result.tags).toEqual([]);
	});

	it('returns empty slug for empty title', () => {
		const page = makePage('proj-3', {
			'Title': mockTitle('')
		});

		expect(mapProject(page).slug).toBe('');
	});

	it('gets id from page.id', () => {
		const page = makePage('unique-id-123', {
			'Title': mockTitle('Test')
		});

		expect(mapProject(page).id).toBe('unique-id-123');
	});

	it('slugifies title with special characters', () => {
		const page = makePage('proj-4', {
			'Title': mockTitle('AI & Climate: Phase 2!')
		});

		expect(mapProject(page).slug).toBe('ai-climate-phase-2');
	});
});

// --- mapTool ---

describe('mapTool', () => {
	it('maps complete properties correctly', () => {
		const page = makePage('tool-1', {
			'Title': mockTitle('BioParser'),
			'Description': mockRichText('Parse biological data'),
			'Category': mockSelect('Tool'),
			'GitHub URL': mockUrl('https://github.com/bio/parser'),
			'Demo URL': mockUrl('https://demo.bioparser.io'),
			'Tags': mockMultiSelect(['Python', 'Biology', 'Data']),
			'Featured': mockCheckbox(true),
			'Files & media': mockFiles('https://s3.aws.com/bioparser.png'),
			'Order': mockNumber(2)
		});

		const result = mapTool(page);

		expect(result.id).toBe('tool-1');
		expect(result.title).toBe('BioParser');
		expect(result.slug).toBe('bioparser');
		expect(result.description).toBe('Parse biological data');
		expect(result.category).toBe('Tool');
		expect(result.githubUrl).toBe('https://github.com/bio/parser');
		expect(result.demoUrl).toBe('https://demo.bioparser.io');
		expect(result.tags).toEqual(['Python', 'Biology', 'Data']);
		expect(result.featured).toBe(true);
		expect(result.imageUrl).toBe('https://s3.aws.com/bioparser.png');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.order).toBe(2);
	});

	it('returns graceful defaults for missing optional properties', () => {
		const page = makePage('tool-2', {
			'Title': mockTitle('Bare Tool')
		});

		const result = mapTool(page);

		expect(result.id).toBe('tool-2');
		expect(result.title).toBe('Bare Tool');
		expect(result.slug).toBe('bare-tool');
		expect(result.description).toBe('');
		expect(result.category).toBe('');
		expect(result.githubUrl).toBe('');
		expect(result.demoUrl).toBe('');
		expect(result.tags).toEqual([]);
		expect(result.featured).toBe(false);
		expect(result.imageUrl).toBe('');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.order).toBe(0);
	});

	it('returns empty slug for empty title', () => {
		const page = makePage('tool-3', {
			'Title': mockTitle('')
		});

		expect(mapTool(page).slug).toBe('');
	});

	it('gets id from page.id', () => {
		const page = makePage('tool-unique-42', {
			'Title': mockTitle('Test')
		});

		expect(mapTool(page).id).toBe('tool-unique-42');
	});

	it('slugifies title correctly', () => {
		const page = makePage('tool-4', {
			'Title': mockTitle('My Open-Source Tool v2.0')
		});

		expect(mapTool(page).slug).toBe('my-open-source-tool-v2-0');
	});
});

// --- mapResource ---

describe('mapResource', () => {
	it('maps complete properties correctly', () => {
		const page = makePage('res-1', {
			'Title': mockTitle('The Selfish Gene'),
			'Description': mockRichText('A foundational text on evolutionary biology'),
			'Type': mockSelect('Book'),
			'Category': mockSelect('Science'),
			'Status': mockSelect('Active'),
			'Author': mockRichText('Richard Dawkins'),
			'URL': mockUrl('https://example.com/book'),
			'Why I Love It': mockRichText('Changed how I think about evolution'),
			'Image': mockFiles('https://s3.aws.com/book-cover.jpg'),
			'Featured': mockCheckbox(true),
			'Order': mockNumber(5)
		});

		const result = mapResource(page);

		expect(result.id).toBe('res-1');
		expect(result.title).toBe('The Selfish Gene');
		expect(result.slug).toBe('the-selfish-gene');
		expect(result.description).toBe('A foundational text on evolutionary biology');
		expect(result.type).toBe('Book');
		expect(result.category).toBe('Science');
		expect(result.status).toBe('Active');
		expect(result.author).toBe('Richard Dawkins');
		expect(result.url).toBe('https://example.com/book');
		expect(result.whyILoveIt).toBe('Changed how I think about evolution');
		expect(result.imageUrl).toBe('https://s3.aws.com/book-cover.jpg');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.featured).toBe(true);
		expect(result.order).toBe(5);
	});

	it('returns graceful defaults for missing optional properties', () => {
		const page = makePage('res-2', {
			'Title': mockTitle('Bare Resource')
		});

		const result = mapResource(page);

		expect(result.id).toBe('res-2');
		expect(result.title).toBe('Bare Resource');
		expect(result.slug).toBe('bare-resource');
		expect(result.description).toBe('');
		expect(result.type).toBe('');
		expect(result.category).toBe('');
		expect(result.status).toBe('');
		expect(result.author).toBe('');
		expect(result.url).toBe('');
		expect(result.whyILoveIt).toBe('');
		expect(result.imageUrl).toBe('');
		expect(result.isVideo).toBe(false);
		expect(result.posterUrl).toBe('');
		expect(result.featured).toBe(false);
		expect(result.order).toBe(0);
	});

	it('returns empty slug for empty title', () => {
		const page = makePage('res-3', {
			'Title': mockTitle('')
		});

		expect(mapResource(page).slug).toBe('');
	});

	it('gets id from page.id', () => {
		const page = makePage('res-unique-99', {
			'Title': mockTitle('Test')
		});

		expect(mapResource(page).id).toBe('res-unique-99');
	});

	it('slugifies title correctly', () => {
		const page = makePage('res-4', {
			'Title': mockTitle("Dawkins' Greatest Hits (2024)")
		});

		expect(mapResource(page).slug).toBe('dawkins-greatest-hits-2024');
	});
});
