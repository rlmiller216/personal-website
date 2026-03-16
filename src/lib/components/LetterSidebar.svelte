<script lang="ts">
	/**
	 * Decorative sidebar showing R, L, M letters that collapse on scroll.
	 * R stays fixed at the top. L and M animate toward it on scroll.
	 * Scales down proportionally on narrower viewports.
	 * Hidden on mobile (<md breakpoint).
	 */
	let scrollY = $state(0);
	let viewportWidth = $state(1280);
	let viewportHeight = $state(800);
	let heroHeight = $state(0);

	// Responsive sizing: scale down at md (768–1023), full at lg (1024+)
	const isLarge = $derived(viewportWidth >= 1024);
	const fontSize = $derived(isLarge ? 72 : 48);
	const sidebarWidth = $derived(isLarge ? 80 : 56);
	const collapsedGap = $derived(fontSize - 6); // letters nearly touching

	// R is always fixed at the top.
	const R_TOP = 6;

	// Gap between letters interpolates from spread to collapsed
	const spreadGap = $derived((viewportHeight * 0.70) / 2);

	// No hero (subpages, reduced motion) → always collapsed.
	const hasHero = $derived(heroHeight > 0);
	const range = $derived(Math.max(heroHeight, 1));
	const progress = $derived(hasHero ? Math.min(scrollY / range, 1) : 1);
	const eased = $derived(1 - (1 - progress) ** 3); // easeOutCubic

	// Current gap interpolates between spread and collapsed
	const gap = $derived(spreadGap + (collapsedGap - spreadGap) * eased);

	// R stays put; L and M are always equally spaced below R
	const positions = $derived([
		R_TOP,
		R_TOP + gap,
		R_TOP + gap * 2
	]);

	$effect(() => {
		const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		// Query hero height via data attribute set on +page.svelte
		const hero = document.querySelector('[data-hero]') as HTMLElement | null;

		if (reducedMotion) {
			heroHeight = 0; // Force collapsed — no animation
		} else {
			heroHeight = hero?.offsetHeight ?? 0;
		}

		viewportWidth = window.innerWidth;
		viewportHeight = window.innerHeight;

		const onScroll = () => { scrollY = window.scrollY; };
		const onResize = () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
			if (!reducedMotion) {
				const h = document.querySelector('[data-hero]') as HTMLElement | null;
				heroHeight = h?.offsetHeight ?? 0;
			}
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onResize, { passive: true });
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onResize);
		};
	});
</script>

<aside
	class="hidden md:flex fixed top-0 left-0 h-screen z-50 bg-white"
	style="width: {sidebarWidth}px;"
	aria-hidden="true"
>
	{#each ['R', 'L', 'M'] as letter, i}
		<span
			class="absolute font-bold select-none pointer-events-none
				left-1/2 -translate-x-1/2 text-hero uppercase tracking-wide"
			style="font-family: 'Raleway', sans-serif;
				font-size: {fontSize}px;
				top: {positions[i]}px;
				will-change: top;"
		>
			{letter}
		</span>
	{/each}
</aside>
