// Detects embed providers from URLs and returns layout configuration.
//
// Used by: notion-blocks.ts when transforming embed/video blocks
// Depends on: nothing (pure utility)

/** Layout configuration for an embedded iframe. */
export interface EmbedConfig {
	provider: string;
	aspectRatio: string;
	minHeight: string;
	/** Iframe loading strategy — 'eager' for WebGL-heavy embeds that fail with lazy loading on iOS Safari. */
	loading?: 'lazy' | 'eager';
}

/** URL patterns mapped to their embed configuration. */
const EMBED_PATTERNS: Array<{ test: RegExp; config: EmbedConfig }> = [
	{
		test: /(?:youtube\.com|youtu\.be)/i,
		config: { provider: 'youtube', aspectRatio: '16/9', minHeight: '315px' }
	},
	{
		test: /vimeo\.com/i,
		config: { provider: 'vimeo', aspectRatio: '16/9', minHeight: '315px' }
	},
	{
		test: /miro\.com/i,
		config: { provider: 'miro', aspectRatio: '4/3', minHeight: '500px' }
	},
	{
		test: /figma\.com/i,
		config: { provider: 'figma', aspectRatio: '16/9', minHeight: '450px' }
	},
	{
		test: /(?:plotly\.com|chart-studio)/i,
		config: { provider: 'plotly', aspectRatio: '4/3', minHeight: '400px' }
	},
	{
		test: /docs\.google\.com/i,
		config: { provider: 'google-docs', aspectRatio: '4/3', minHeight: '500px' }
	},
	{
		test: /molstar\.org/i,
		config: { provider: 'molstar', aspectRatio: '1/1', minHeight: '500px', loading: 'eager' }
	}
];

const GENERIC_CONFIG: EmbedConfig = {
	provider: 'generic',
	aspectRatio: '16/9',
	minHeight: '400px'
};

/** Returns embed layout config based on URL pattern matching. */
export function getEmbedConfig(url: string): EmbedConfig {
	if (!url) return GENERIC_CONFIG;

	const match = EMBED_PATTERNS.find((p) => p.test.test(url));
	return match ? match.config : GENERIC_CONFIG;
}
