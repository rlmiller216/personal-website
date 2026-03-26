// Content types matching Notion database schemas.
//
// Used by: services/*.service.ts for mapping, routes/ for page data
// Depends on: nothing (pure type definitions + slugify helper)

/** Convert a title to a URL-safe kebab-case slug. */
export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

/** True if the URL points to a video file based on extension. */
export function isVideoUrl(url: string): boolean {
	if (!url) return false;
	try {
		const pathname = new URL(url, 'https://placeholder').pathname.toLowerCase();
		return VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
	} catch {
		return false;
	}
}

/** A professional project from the Projects database. */
export interface Project {
	id: string;
	slug: string;
	title: string;
	description: string;
	sector: string[];
	status: string;
	role: string;
	imageUrl: string;
	isVideo: boolean;
	posterUrl: string;
	url: string;
	featured: boolean;
	order: number;
	tags: string[];
}

/** An open source tool from the Open Source database. */
export interface Tool {
	id: string;
	slug: string;
	title: string;
	description: string;
	category: string;
	githubUrl: string;
	demoUrl: string;
	tags: string[];
	featured: boolean;
	imageUrl: string;
	isVideo: boolean;
	posterUrl: string;
	order: number;
}

/** A curated resource from the Resources database. */
export interface Resource {
	id: string;
	slug: string;
	title: string;
	description: string;
	type: string;
	category: string;
	author: string;
	url: string;
	whyILoveIt: string;
	imageUrl: string;
	isVideo: boolean;
	posterUrl: string;
	order: number;
	featured: boolean;
}

/** Rich text annotation from Notion. */
export interface RichTextAnnotation {
	bold: boolean;
	italic: boolean;
	strikethrough: boolean;
	underline: boolean;
	code: boolean;
	color: string;
}

/** A single span of rich text with annotations and optional link. */
export interface RichTextSpan {
	text: string;
	annotations: RichTextAnnotation;
	href: string | null;
}

/**
 * A serializable Notion block for Svelte rendering.
 *
 * The server transforms Notion API BlockObjectResponse[] into ContentBlock[]
 * at build time. Svelte components render these without touching the Notion API.
 */
export interface ContentBlock {
	id: string;
	type:
		| 'paragraph'
		| 'heading_1'
		| 'heading_2'
		| 'heading_3'
		| 'heading_4'
		| 'bulleted_list'
		| 'numbered_list'
		| 'bulleted_list_item'
		| 'numbered_list_item'
		| 'to_do'
		| 'toggle'
		| 'quote'
		| 'callout'
		| 'divider'
		| 'image'
		| 'code'
		| 'bookmark'
		| 'embed'
		| 'video'
		| 'table'
		| 'audio'
		| 'file'
		| 'pdf'
		| 'equation'
		| 'column_list'
		| 'synced_block';
	richText: RichTextSpan[];
	children: ContentBlock[];
	/** Image/video/embed URL. */
	url: string;
	/** Image caption or bookmark description. */
	caption: RichTextSpan[];
	/** Code block language (e.g., "typescript", "python"). */
	language: string;
	/** To-do item checked state. */
	checked: boolean;
	/** Callout icon (emoji or URL). */
	icon: string;

	// -- Code blocks (Shiki) --
	/** Pre-rendered HTML from Shiki syntax highlighter. */
	highlightedHtml?: string;

	// -- Table blocks --
	/** Table rows as a 2D array of rich text spans. */
	rows?: RichTextSpan[][][];
	/** Whether the first row is a header row. */
	hasHeader?: boolean;

	// -- Column layout --
	/** Each inner array is one column's content blocks. */
	columns?: ContentBlock[][];

	// -- Equation --
	/** LaTeX/KaTeX expression string. */
	expression?: string;

	// -- File downloads --
	/** Original file name for download links. */
	fileName?: string;
	/** Direct URL to the file. */
	fileUrl?: string;

	// -- Toggle headings --
	/** Whether a heading block is toggleable (expands/collapses to show children). */
	isToggleable?: boolean;

	// -- Embed detection --
	/** Detected provider (e.g., "youtube", "vimeo"). */
	embedType?: string;
	/** CSS aspect-ratio value (e.g., "16/9"). */
	embedAspectRatio?: string;
	/** CSS min-height value (e.g., "500px"). */
	embedMinHeight?: string;
	/** Iframe loading strategy — 'eager' bypasses lazy loading for WebGL embeds that fail on iOS Safari. */
	embedLoading?: 'lazy' | 'eager';
}
