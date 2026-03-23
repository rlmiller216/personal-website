import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html'
		}),
		prerender: {
			handleHttpError: ({ path, message }) => {
				// Files downloaded during prerender land in static/ but miss
				// Vite's earlier snapshot. Post-build cp handles this.
				if (path.startsWith('/images/') || path.startsWith('/files/')) return;
				// Notion internal page links (raw page IDs) — not routable
				if (/^\/[0-9a-f]{32}\b/.test(path)) return;
				throw new Error(message);
			}
		}
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
