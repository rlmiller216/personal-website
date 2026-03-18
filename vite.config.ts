import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Exclude worktree directories — they contain stale copies of tests
		// that import from outdated $lib paths and cause false failures.
		exclude: ['**/node_modules/**', '.claude/**']
	}
});
