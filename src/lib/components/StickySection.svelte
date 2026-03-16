<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		highlightWord,
		href,
		variant = 'white',
		children
	}: {
		title: string;
		highlightWord: string;
		href: string;
		variant?: 'white' | 'muted';
		children: Snippet;
	} = $props();

	// Background class — white variant uses bg-white in light, bg-background in dark
	// to avoid card-on-card visual confusion
	const bgClass = $derived(
		variant === 'white' ? 'bg-white dark:bg-background' : 'bg-background'
	);
</script>

<section class="relative w-full {bgClass}">
	<!-- Sticky header — pins at top of viewport (desktop) or below fixed nav (mobile) -->
	<div
		class="sticky z-30 py-4 {bgClass} top-16 md:top-0"
	>
		<div class="max-w-6xl mx-auto px-6 flex items-baseline justify-between">
			<h2
				class="text-3xl md:text-4xl font-bold"
				style="font-family: 'Raleway', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;"
			>
				{title} <span class="text-highlight">{highlightWord}</span>
			</h2>
			<a
				href={href}
				class="group flex items-center gap-1 text-sm font-medium text-primary shrink-0"
				style="font-family: 'Raleway', sans-serif;"
			>
				View all <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>
	</div>

	<!-- Content area — card layouts rendered by caller via snippet -->
	<div class="max-w-6xl mx-auto px-6 pb-12 pt-2">
		{@render children()}
	</div>
</section>
