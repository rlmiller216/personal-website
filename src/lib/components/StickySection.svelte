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

	// Sentinel element for IntersectionObserver stuck detection
	let sentinel: HTMLElement;
	let isStuck = $state(false);

	$effect(() => {
		if (!sentinel) return;
		// Mobile has fixed nav at 64px — offset rootMargin. Desktop: no fixed nav.
		const isDesktopView = window.matchMedia('(min-width: 768px)').matches;
		const rootMargin = isDesktopView ? '0px 0px 0px 0px' : '-65px 0px 0px 0px';
		const observer = new IntersectionObserver(
			([entry]) => {
				isStuck = !entry.isIntersecting;
			},
			{ threshold: 0, rootMargin }
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	});

	// Background class — white variant uses bg-white in light, bg-background in dark
	// to avoid card-on-card visual confusion
	const bgClass = $derived(
		variant === 'white' ? 'bg-white dark:bg-background' : 'bg-background'
	);
</script>

<section class="relative w-full {bgClass}">
	<!-- Sentinel: triggers stuck detection when it scrolls behind the nav -->
	<div bind:this={sentinel} class="absolute top-0 left-0 w-full h-px" aria-hidden="true"></div>

	<!-- Sticky header — shadow-only transition when stuck, no padding compression -->
	<div
		class="sticky z-30 py-4 transition-shadow duration-300 {bgClass}
			{isStuck ? 'shadow-sm' : ''} top-16 md:top-0 will-change-[box-shadow]"
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
