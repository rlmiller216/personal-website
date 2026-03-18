// Build-time Notion file downloader.
//
// Downloads signed S3 files (images, PDFs, etc.) to static/ so they persist
// after URL expiry (~1 hour). Deduplicates concurrent calls via a promise Map.
// Falls back to the original URL on any failure — the site still works
// for ~1 hour, which is better than a build crash.
//
// Called by: all service fetchers (downloadItemImages) + notion-blocks.ts

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import heicConvert from 'heic-convert';
import { isVideoUrl } from '$lib/types/content';

const MODULE = '[files]';
const IMAGE_DIR = 'static/images';
const FILES_DIR = 'static/files';
const KNOWN_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);
const KNOWN_VIDEO_EXTS = new Set(['.mp4', '.webm', '.mov']);
const KNOWN_FILE_EXTS = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.pptx', '.csv', '.zip']);

/** Content types that are safe to cache (reject S3 error pages which are XML/HTML). */
const SAFE_CONTENT_TYPES = ['image/', 'video/', 'application/pdf', 'application/octet-stream',
	'application/zip', 'application/vnd.', 'text/csv'];

/** Dedup map: URL pathname → Promise<local path or original URL>. */
const inflight = new Map<string, Promise<string>>();
let imageDirEnsured = false;
let filesDirEnsured = false;

/** True if this URL is a Notion-hosted S3 file (signed, expires ~1h). */
export function isNotionS3Url(url: string): boolean {
	return url.includes('prod-files-secure.s3');
}

/** True if the content-type is safe to cache (not an error page). */
function isSafeContentType(contentType: string): boolean {
	return SAFE_CONTENT_TYPES.some((prefix) => contentType.startsWith(prefix));
}

/** HEIC magic bytes: offset 4 = "ftyp", offset 8 = "heic" or "heix" or "mif1". */
function isHeicBuffer(buf: Buffer): boolean {
	if (buf.length < 12) return false;
	const ftyp = buf.toString('ascii', 4, 8);
	const brand = buf.toString('ascii', 8, 12);
	return ftyp === 'ftyp' && (brand === 'heic' || brand === 'heix' || brand === 'mif1');
}

/** Convert HEIC buffer to JPEG. Returns original buffer if conversion fails. */
async function convertHeicToJpeg(buf: Buffer, cacheKey: string): Promise<Buffer> {
	try {
		const result = await heicConvert({ buffer: buf, format: 'JPEG', quality: 0.9 });
		console.log(`${MODULE} converted HEIC → JPEG: ${cacheKey}`);
		return Buffer.from(result);
	} catch (err) {
		console.warn(`${MODULE} HEIC conversion failed, keeping original: ${cacheKey}`, err);
		return buf;
	}
}

/** Deterministic filename from URL path (ignores query params / signatures). */
export function hashUrlToFilename(url: string): string {
	const pathname = new URL(url).pathname;
	const dotIdx = pathname.lastIndexOf('.');
	const rawExt = dotIdx !== -1 ? pathname.slice(dotIdx).toLowerCase() : '';
	const ext = KNOWN_IMAGE_EXTS.has(rawExt) || KNOWN_VIDEO_EXTS.has(rawExt) || KNOWN_FILE_EXTS.has(rawExt) ? rawExt : '.jpg';
	const hash = createHash('sha256').update(pathname).digest('hex').slice(0, 12);
	return `${hash}${ext}`;
}

/**
 * Downloads a Notion S3 image to static/images/ and returns the local path.
 * Non-S3 URLs pass through unchanged. Failures fall back to the original URL.
 */
export async function downloadNotionImage(url: string): Promise<string> {
	return downloadS3File(url, IMAGE_DIR, '/images/', () => {
		if (!imageDirEnsured) { mkdirSync(IMAGE_DIR, { recursive: true }); imageDirEnsured = true; }
	});
}

/**
 * Downloads a Notion S3 file (PDF, etc.) to static/files/ and returns the local path.
 * Non-S3 URLs pass through unchanged. Failures fall back to the original URL.
 */
export async function downloadNotionFile(url: string): Promise<string> {
	return downloadS3File(url, FILES_DIR, '/files/', () => {
		if (!filesDirEnsured) { mkdirSync(FILES_DIR, { recursive: true }); filesDirEnsured = true; }
	});
}

/** Shared downloader — caches S3 files to a local directory. */
async function downloadS3File(
	url: string, dir: string, publicPrefix: string, ensureDir: () => void
): Promise<string> {
	if (!url || !isNotionS3Url(url)) return url;

	const cacheKey = new URL(url).pathname;

	const existing = inflight.get(cacheKey);
	if (existing) return existing;

	const promise = (async () => {
		try {
			const filename = hashUrlToFilename(url);
			const filePath = `${dir}/${filename}`;

			ensureDir();

			// Skip if already downloaded (dev mode re-runs)
			if (existsSync(filePath)) {
				return `${publicPrefix}${filename}`;
			}

			const response = await fetch(url);
			if (!response.ok) {
				console.warn(`${MODULE} fetch failed (${response.status}): ${cacheKey}`);
				return url;
			}

			// Reject S3 error pages (XML/HTML) but allow images, videos, PDFs, and other files
			const contentType = response.headers.get('content-type') ?? '';
			// Safety net: warn if content-type says video but extension doesn't match
			const dotIdx = new URL(url).pathname.lastIndexOf('.');
			const rawExt = dotIdx !== -1 ? new URL(url).pathname.slice(dotIdx).toLowerCase() : '';
			if (contentType.startsWith('video/') && !KNOWN_VIDEO_EXTS.has(rawExt)) {
				console.warn(`${MODULE} content-type "${contentType}" doesn't match extension "${rawExt}": ${cacheKey}`);
			}
			if (!isSafeContentType(contentType)) {
				console.warn(`${MODULE} unexpected content-type "${contentType}": ${cacheKey}`);
				return url;
			}

			let buffer = Buffer.from(await response.arrayBuffer());

			// HEIC images (from iPhone uploads) are unrenderable in browsers.
			// Detect via magic bytes and convert to JPEG.
			if (isHeicBuffer(buffer)) {
				buffer = await convertHeicToJpeg(buffer, cacheKey);
			}

			await writeFile(filePath, buffer);
			console.log(`${MODULE} cached: ${filename}`);
			return `${publicPrefix}${filename}`;
		} catch (err) {
			console.warn(`${MODULE} failed: ${cacheKey}`, err);
			return url;
		}
	})();

	inflight.set(cacheKey, promise);
	return promise;
}

/** Downloads media for all items with imageUrl/posterUrl properties. Mutates in-place.
 *  Sets isVideo based on the resolved local path extension. */
export async function downloadItemMedia(
	items: { imageUrl: string; isVideo: boolean; posterUrl: string }[]
): Promise<void> {
	await Promise.all(
		items.map(async (item) => {
			if (item.imageUrl) {
				item.imageUrl = await downloadNotionImage(item.imageUrl);
				item.isVideo = isVideoUrl(item.imageUrl);
			}
			if (item.posterUrl) {
				item.posterUrl = await downloadNotionImage(item.posterUrl);
			}
		})
	);
}
