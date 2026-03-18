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
			// Images downloaded during prerender land in static/images/ but miss
			// Vite's earlier snapshot of static/. Post-build cp handles this.
			handleHttpError: ({ path, message }) => {
				// Files downloaded during prerender land in static/ but miss
				// Vite's earlier snapshot. Post-build cp handles this.
				if (path.startsWith('/images/') || path.startsWith('/files/')) return;
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
