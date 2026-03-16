<script lang="ts">
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
		<div class="max-w-6xl mx-auto px-6">
			<a
				href={href}
				class="group inline-flex items-baseline gap-3 text-3xl md:text-4xl font-bold
					hover:text-primary transition-colors uppercase tracking-wide"
			>
				{title} <span class="text-highlight">{highlightWord}</span>
				<!-- Sharp angular arrow — matches Raleway's geometric character -->
				<svg
					class="h-9 w-9 md:h-11 md:w-11 text-primary self-center
						transition-transform group-hover:translate-x-2"
					viewBox="0 0 24 24" fill="none" stroke="currentColor"
					stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"
				>
					<path d="M5 12h14M13 5l7 7-7 7" />
				</svg>
			</a>
		</div>
	</div>

	<!-- Content area — card layouts rendered by caller via snippet -->
	<div class="max-w-6xl mx-auto px-6 pb-12 pt-2">
		{@render children()}
	</div>
</section>
