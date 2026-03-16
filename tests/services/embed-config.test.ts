// Tests for embed URL detection and configuration.
//
// Verifies each known provider is detected and unknown URLs get generic config.

import { describe, it, expect } from 'vitest';
import { getEmbedConfig } from '$lib/server/services/embed-config';

describe('getEmbedConfig', () => {
	it('detects YouTube URLs', () => {
		const config = getEmbedConfig('https://www.youtube.com/watch?v=abc123');
		expect(config.provider).toBe('youtube');
		expect(config.aspectRatio).toBe('16/9');
	});

	it('detects YouTube short URLs', () => {
		const config = getEmbedConfig('https://youtu.be/abc123');
		expect(config.provider).toBe('youtube');
	});

	it('detects Vimeo URLs', () => {
		const config = getEmbedConfig('https://vimeo.com/123456');
		expect(config.provider).toBe('vimeo');
		expect(config.aspectRatio).toBe('16/9');
	});

	it('detects Miro URLs', () => {
		const config = getEmbedConfig('https://miro.com/app/board/xyz');
		expect(config.provider).toBe('miro');
		expect(config.aspectRatio).toBe('4/3');
		expect(config.minHeight).toBe('500px');
	});

	it('detects Figma URLs', () => {
		const config = getEmbedConfig('https://www.figma.com/file/abc');
		expect(config.provider).toBe('figma');
		expect(config.minHeight).toBe('450px');
	});

	it('detects Plotly URLs', () => {
		const config = getEmbedConfig('https://chart-studio.plotly.com/~user/1');
		expect(config.provider).toBe('plotly');
		expect(config.aspectRatio).toBe('4/3');
	});

	it('detects Google Docs URLs', () => {
		const config = getEmbedConfig('https://docs.google.com/spreadsheets/d/abc');
		expect(config.provider).toBe('google-docs');
		expect(config.minHeight).toBe('500px');
	});

	it('detects Mol* viewer URLs', () => {
		const config = getEmbedConfig('https://molstar.org/viewer/?pdb=5DHG&hide-controls=1');
		expect(config.provider).toBe('molstar');
		expect(config.aspectRatio).toBe('1/1');
		expect(config.minHeight).toBe('500px');
	});

	it('returns generic config for unknown URLs', () => {
		const config = getEmbedConfig('https://example.com/widget');
		expect(config.provider).toBe('generic');
		expect(config.aspectRatio).toBe('16/9');
		expect(config.minHeight).toBe('400px');
	});

	it('returns generic config for empty string', () => {
		const config = getEmbedConfig('');
		expect(config.provider).toBe('generic');
	});

	it('matches case-insensitively', () => {
		const config = getEmbedConfig('https://WWW.YOUTUBE.COM/watch?v=abc');
		expect(config.provider).toBe('youtube');
	});
});
