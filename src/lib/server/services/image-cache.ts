// Build-time Notion image downloader.
//
// Downloads signed S3 images to static/images/ so they persist after
// URL expiry (~1 hour). Deduplicates concurrent calls via a promise Map.
// Falls back to the original URL on any failure — the site still works
// for ~1 hour, which is better than a build crash.
//
// Called by: all service fetchers (downloadItemImages) + notion-blocks.ts (downloadNotionImage)

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';

const MODULE = '[images]';
const IMAGE_DIR = 'static/images';
const KNOWN_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

/** Dedup map: URL pathname → Promise<local path or original URL>. */
const inflight = new Map<string, Promise<string>>();
let dirEnsured = false;

/** True if this URL is a Notion-hosted S3 image (signed, expires ~1h). */
export function isNotionS3Url(url: string): boolean {
	return url.includes('prod-files-secure.s3');
}

/** Deterministic filename from URL path (ignores query params / signatures). */
export function hashUrlToFilename(url: string): string {
	const pathname = new URL(url).pathname;
	const dotIdx = pathname.lastIndexOf('.');
	const rawExt = dotIdx !== -1 ? pathname.slice(dotIdx).toLowerCase() : '';
	const ext = KNOWN_EXTS.has(rawExt) ? rawExt : '.jpg';
	const hash = createHash('sha256').update(pathname).digest('hex').slice(0, 12);
	return `${hash}${ext}`;
}

/**
 * Downloads a Notion S3 image to static/images/ and returns the local path.
 * Non-S3 URLs pass through unchanged. Failures fall back to the original URL.
 */
export async function downloadNotionImage(url: string): Promise<string> {
	if (!url || !isNotionS3Url(url)) return url;

	const cacheKey = new URL(url).pathname;

	const existing = inflight.get(cacheKey);
	if (existing) return existing;

	const promise = (async () => {
		try {
			const filename = hashUrlToFilename(url);
			const filePath = `${IMAGE_DIR}/${filename}`;

			// Lazy directory creation — once per build
			if (!dirEnsured) {
				mkdirSync(IMAGE_DIR, { recursive: true });
				dirEnsured = true;
			}

			// Skip if already downloaded (dev mode re-runs)
			if (existsSync(filePath)) {
				return `/images/${filename}`;
			}

			const response = await fetch(url);
			if (!response.ok) {
				console.warn(`${MODULE} fetch failed (${response.status}): ${cacheKey}`);
				return url;
			}

			// Reject non-image responses (S3 error pages are XML/HTML)
			const contentType = response.headers.get('content-type') ?? '';
			if (!contentType.startsWith('image/')) {
				console.warn(`${MODULE} unexpected content-type "${contentType}": ${cacheKey}`);
				return url;
			}

			const buffer = await response.arrayBuffer();
			await writeFile(filePath, Buffer.from(buffer));
			console.log(`${MODULE} cached: ${filename}`);
			return `/images/${filename}`;
		} catch (err) {
			console.warn(`${MODULE} failed: ${cacheKey}`, err);
			return url;
		}
	})();

	inflight.set(cacheKey, promise);
	return promise;
}

/** Downloads images for all items with an imageUrl property. Mutates in-place. */
export async function downloadItemImages(
	items: { imageUrl: string }[]
): Promise<void> {
	await Promise.all(
		items.map(async (item) => {
			if (item.imageUrl) {
				item.imageUrl = await downloadNotionImage(item.imageUrl);
			}
		})
	);
}
