// Build-time image optimization via sharp.
//
// Resizes oversized images, compresses JPEGs, converts opaque PNGs
// to JPEG. Also provides dimension reading for cached images.
// Called by: image-cache.ts (optimization), notion-blocks.ts (dimensions)

import sharp from 'sharp';

const MODULE = '[image-optimize]';
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 80;
const PNG_COMPRESSION = 8;
// WebP already well-compressed; skip re-encoding to avoid lossy→lossy quality loss
const SKIP_EXTS = new Set(['.svg', '.gif', '.webp', '.mp4', '.webm', '.mov', '.pdf']);

export interface OptimizeResult {
	buffer: Buffer;
	filename: string;
	/** Image width in pixels. 0 if unavailable (skipped file type or error). */
	width: number;
	/** Image height in pixels. 0 if unavailable (skipped file type or error). */
	height: number;
}

/** Optimize an image buffer: resize if oversized, compress, convert opaque PNG to JPEG. */
export async function optimizeImage(buffer: Buffer, filename: string): Promise<OptimizeResult> {
	const ext = filename.slice(filename.lastIndexOf('.')).toLowerCase();
	if (SKIP_EXTS.has(ext)) return { buffer, filename, width: 0, height: 0 };

	try {
		let pipeline = sharp(buffer);
		const meta = await pipeline.metadata();
		if (!meta.width || !meta.height) return { buffer, filename, width: 0, height: 0 };

		if (meta.width > MAX_WIDTH) {
			pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
		}

		const isPng = ext === '.png';
		const hasAlpha = meta.hasAlpha === true;
		let outFilename = filename;
		let result: { data: Buffer; info: sharp.OutputInfo };

		if (isPng && !hasAlpha) {
			result = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer({ resolveWithObject: true });
			outFilename = filename.replace(/\.png$/i, '.jpg');
			console.log(`${MODULE} PNG→JPEG: ${filename} → ${outFilename}`);
		} else if (isPng) {
			result = await pipeline.png({ compressionLevel: PNG_COMPRESSION }).toBuffer({ resolveWithObject: true });
		} else {
			result = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer({ resolveWithObject: true });
		}

		return { buffer: result.data, filename: outFilename, width: result.info.width, height: result.info.height };
	} catch (err) {
		console.warn(`${MODULE} failed, using original: ${filename}`, err);
		return { buffer, filename, width: 0, height: 0 };
	}
}

/** Read dimensions from a local image file. Returns undefined for non-images or errors. */
export async function getImageDimensions(
	filePath: string
): Promise<{ width: number; height: number } | undefined> {
	try {
		const meta = await sharp(filePath).metadata();
		if (meta.width && meta.height) return { width: meta.width, height: meta.height };
	} catch { /* non-image or missing file */ }
	return undefined;
}
