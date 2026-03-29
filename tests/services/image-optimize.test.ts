import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { optimizeImage, getImageDimensions } from '$lib/server/services/image-optimize';

async function makeJpeg(w: number, h: number): Promise<Buffer> {
	return sharp({ create: { width: w, height: h, channels: 3, background: { r: 128, g: 128, b: 128 } } })
		.jpeg({ quality: 100 }).toBuffer();
}
async function makePng(w: number, h: number): Promise<Buffer> {
	return sharp({ create: { width: w, height: h, channels: 3, background: { r: 128, g: 128, b: 128 } } })
		.png().toBuffer();
}
async function makePngAlpha(w: number, h: number): Promise<Buffer> {
	return sharp({ create: { width: w, height: h, channels: 4, background: { r: 128, g: 128, b: 128, alpha: 0.5 } } })
		.png().toBuffer();
}
async function makeWebp(w: number, h: number): Promise<Buffer> {
	return sharp({ create: { width: w, height: h, channels: 3, background: { r: 128, g: 128, b: 128 } } })
		.webp({ quality: 100 }).toBuffer();
}

describe('optimizeImage', () => {
	it('compresses JPEG and returns correct dimensions', async () => {
		const input = await makeJpeg(800, 600);
		const result = await optimizeImage(input, 'photo.jpg');
		expect(result.width).toBe(800);
		expect(result.height).toBe(600);
		expect(result.filename).toBe('photo.jpg');
	});

	it('resizes JPEG when wider than 1600px', async () => {
		const input = await makeJpeg(3200, 2400);
		const result = await optimizeImage(input, 'big.jpg');
		expect(result.width).toBe(1600);
		expect(result.height).toBe(1200);
	});

	it('converts opaque PNG to JPEG', async () => {
		const input = await makePng(800, 600);
		const result = await optimizeImage(input, 'screenshot.png');
		expect(result.filename).toBe('screenshot.jpg');
		expect(result.width).toBe(800);
	});

	it('keeps PNG with alpha channel as PNG', async () => {
		const input = await makePngAlpha(800, 600);
		const result = await optimizeImage(input, 'logo.png');
		expect(result.filename).toBe('logo.png');
	});

	it('resizes oversized PNG and converts to JPEG', async () => {
		const input = await makePng(4000, 3000);
		const result = await optimizeImage(input, 'huge.png');
		expect(result.width).toBe(1600);
		expect(result.height).toBe(1200);
		expect(result.filename).toBe('huge.jpg');
	});

	it('keeps WebP as WebP (no lossy transcode)', async () => {
		const input = await makeWebp(800, 600);
		const result = await optimizeImage(input, 'image.webp');
		expect(result.filename).toBe('image.webp');
	});

	it('passes through SVG unchanged', async () => {
		const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
		const result = await optimizeImage(svgBuf, 'icon.svg');
		expect(result.buffer).toBe(svgBuf);
		expect(result.width).toBe(0);
	});

	it('passes through GIF unchanged', async () => {
		const gifBuf = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
		const result = await optimizeImage(gifBuf, 'anim.gif');
		expect(result.buffer).toBe(gifBuf);
	});

	it('passes through video files unchanged', async () => {
		const buf = Buffer.from('fake');
		const result = await optimizeImage(buf, 'clip.mp4');
		expect(result.buffer).toBe(buf);
	});

	it('returns original buffer on processing error', async () => {
		const result = await optimizeImage(Buffer.from('corrupt'), 'broken.jpg');
		expect(result.width).toBe(0);
	});
});

describe('getImageDimensions', () => {
	it('returns dimensions for a local image path', async () => {
		const buf = await makeJpeg(1024, 768);
		const tmpPath = join(tmpdir(), `test-dim-${randomUUID()}.jpg`);
		writeFileSync(tmpPath, buf);
		try {
			const dims = await getImageDimensions(tmpPath);
			expect(dims).toEqual({ width: 1024, height: 768 });
		} finally {
			unlinkSync(tmpPath);
		}
	});

	it('returns undefined for non-existent file', async () => {
		const dims = await getImageDimensions('/nonexistent/path/image.jpg');
		expect(dims).toBeUndefined();
	});
});
