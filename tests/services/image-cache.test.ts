// Tests for the build-time Notion image downloader.
//
// Mocks: node:fs, node:fs/promises, global fetch.
// Tests pure functions (isNotionS3Url, hashUrlToFilename) and
// the download coordinator (downloadNotionImage).

import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mocks ---

const mockExistsSync = vi.fn().mockReturnValue(false);
const mockMkdirSync = vi.fn();
vi.mock('node:fs', () => ({
	existsSync: (...args: unknown[]) => mockExistsSync(...args),
	mkdirSync: (...args: unknown[]) => mockMkdirSync(...args)
}));

const mockWriteFile = vi.fn().mockResolvedValue(undefined);
vi.mock('node:fs/promises', () => ({
	writeFile: (...args: unknown[]) => mockWriteFile(...args)
}));

// Import AFTER mocks are set up
const { isNotionS3Url, hashUrlToFilename, downloadNotionImage, downloadNotionFile } = await import(
	'$lib/server/services/image-cache'
);

// --- Helpers ---

const S3_URL =
	'https://prod-files-secure.s3.us-west-2.amazonaws.com/workspace/block/photo.jpg?X-Amz-Expires=3600&X-Amz-Signature=abc123';

const S3_URL_DIFFERENT_SIG =
	'https://prod-files-secure.s3.us-west-2.amazonaws.com/workspace/block/photo.jpg?X-Amz-Expires=3600&X-Amz-Signature=xyz789';

function mockFetchOk(contentType = 'image/jpeg') {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: true,
		headers: { get: (h: string) => (h === 'content-type' ? contentType : null) },
		arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

function mockFetchFail() {
	const fetchMock = vi.fn().mockResolvedValue({
		ok: false,
		status: 403,
		headers: { get: () => null }
	});
	vi.stubGlobal('fetch', fetchMock);
	return fetchMock;
}

// --- Pure function tests ---

describe('isNotionS3Url', () => {
	it('returns true for prod-files-secure S3 URLs', () => {
		expect(isNotionS3Url(S3_URL)).toBe(true);
	});

	it('returns false for external URLs and empty strings', () => {
		expect(isNotionS3Url('https://images.unsplash.com/photo.jpg')).toBe(false);
		expect(isNotionS3Url('')).toBe(false);
		expect(isNotionS3Url('not a url')).toBe(false);
	});
});

describe('hashUrlToFilename', () => {
	it('produces a stable hash from the URL path, ignoring query params', () => {
		const name = hashUrlToFilename(S3_URL);
		expect(name).toMatch(/^[a-f0-9]{12}\.jpg$/);
	});

	it('preserves .jpg, .png, .webp extensions', () => {
		expect(hashUrlToFilename('https://example.com/path/image.png?q=1')).toMatch(/\.png$/);
		expect(hashUrlToFilename('https://example.com/path/image.webp?q=1')).toMatch(/\.webp$/);
		expect(hashUrlToFilename('https://example.com/path/image.jpg?q=1')).toMatch(/\.jpg$/);
	});

	it('preserves .mp4, .webm, .mov video extensions', () => {
		expect(hashUrlToFilename('https://example.com/path/clip.mp4?q=1')).toMatch(/\.mp4$/);
		expect(hashUrlToFilename('https://example.com/path/clip.webm?q=1')).toMatch(/\.webm$/);
		expect(hashUrlToFilename('https://example.com/path/clip.mov?q=1')).toMatch(/\.mov$/);
	});

	it('preserves .pdf extension', () => {
		expect(hashUrlToFilename('https://example.com/path/paper.pdf?q=1')).toMatch(/\.pdf$/);
	});

	it('defaults to .jpg when no recognizable extension', () => {
		expect(hashUrlToFilename('https://example.com/path/image?q=1')).toMatch(/\.jpg$/);
	});

	it('returns the same hash for different query params on the same path', () => {
		const hash1 = hashUrlToFilename(S3_URL);
		const hash2 = hashUrlToFilename(S3_URL_DIFFERENT_SIG);
		expect(hash1).toBe(hash2);
	});
});

// --- Download logic tests ---

describe('downloadNotionImage', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
		mockExistsSync.mockReturnValue(false);
		mockWriteFile.mockResolvedValue(undefined);
	});

	it('returns original URL for non-S3 URLs (passthrough)', async () => {
		const url = 'https://images.unsplash.com/photo.jpg';
		const result = await downloadNotionImage(url);
		expect(result).toBe(url);
	});

	it('returns original URL for empty string', async () => {
		const result = await downloadNotionImage('');
		expect(result).toBe('');
	});

	it('fetches S3 URL, writes file, returns /images/{hash}.ext', async () => {
		const fetchMock = mockFetchOk();

		const result = await downloadNotionImage(S3_URL);

		expect(fetchMock).toHaveBeenCalledWith(S3_URL);
		expect(mockWriteFile).toHaveBeenCalledOnce();
		expect(result).toMatch(/^\/images\/[a-f0-9]{12}\.jpg$/);
	});

	it('returns original URL on fetch failure and logs warning', async () => {
		mockFetchFail();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await downloadNotionImage(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/fail.jpg?X-Amz-Expires=3600'
		);

		expect(result).toContain('prod-files-secure');
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('returns original URL when Content-Type is not image/*', async () => {
		mockFetchOk('application/xml');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await downloadNotionImage(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/xml.jpg?X-Amz-Expires=3600'
		);

		expect(result).toContain('prod-files-secure');
		expect(mockWriteFile).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('deduplicates concurrent calls — fetch called once, not twice', async () => {
		const fetchMock = mockFetchOk();
		const dedupUrl =
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/dedup.png?X-Amz-Expires=3600';

		const [r1, r2] = await Promise.all([
			downloadNotionImage(dedupUrl),
			downloadNotionImage(dedupUrl)
		]);

		expect(r1).toBe(r2);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('skips download if file already exists on disk', async () => {
		mockExistsSync.mockReturnValue(true);
		const fetchMock = mockFetchOk();

		const result = await downloadNotionImage(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/exists.jpg?X-Amz-Expires=3600'
		);

		expect(result).toMatch(/^\/images\/[a-f0-9]{12}\.jpg$/);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('accepts video/mp4 content-type and writes file', async () => {
		mockFetchOk('video/mp4');

		const result = await downloadNotionImage(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/clip.mp4?X-Amz-Expires=3600'
		);

		expect(mockWriteFile).toHaveBeenCalledOnce();
		expect(result).toMatch(/^\/images\/[a-f0-9]{12}\.mp4$/);
	});
});

// --- File download tests (PDFs, etc.) ---

describe('downloadNotionFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllGlobals();
		mockExistsSync.mockReturnValue(false);
		mockWriteFile.mockResolvedValue(undefined);
	});

	it('returns original URL for non-S3 URLs (passthrough)', async () => {
		const url = 'https://example.com/paper.pdf';
		const result = await downloadNotionFile(url);
		expect(result).toBe(url);
	});

	it('returns original URL for empty string', async () => {
		const result = await downloadNotionFile('');
		expect(result).toBe('');
	});

	it('fetches S3 URL, writes file, returns /files/{hash}.pdf', async () => {
		const fetchMock = mockFetchOk('application/pdf');

		const result = await downloadNotionFile(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/paper.pdf?X-Amz-Expires=3600'
		);

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(mockWriteFile).toHaveBeenCalledOnce();
		expect(result).toMatch(/^\/files\/[a-f0-9]{12}\.pdf$/);
	});

	it('returns original URL on fetch failure', async () => {
		mockFetchFail();
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await downloadNotionFile(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/fail.pdf?X-Amz-Expires=3600'
		);

		expect(result).toContain('prod-files-secure');
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});

	it('rejects XML error pages (S3 error response)', async () => {
		mockFetchOk('application/xml');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const result = await downloadNotionFile(
			'https://prod-files-secure.s3.us-west-2.amazonaws.com/w/b/error.pdf?X-Amz-Expires=3600'
		);

		expect(result).toContain('prod-files-secure');
		expect(mockWriteFile).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalled();
		warnSpy.mockRestore();
	});
});
