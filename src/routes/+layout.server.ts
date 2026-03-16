// Root layout server load — provides site metadata to all pages.
//
// Reads from environment variables so nothing is hardcoded in templates.
// Called once at build time by adapter-static.

import { env } from '$env/dynamic/private';

export function load() {
	return {
		siteName: env.SITE_NAME || 'Rebecca Miller',
		siteTagline: env.SITE_TAGLINE || 'Scientist committed to the greater good'
	};
}
