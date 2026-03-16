<script lang="ts">
	/**
	 * Decorative sidebar showing R, L, M letters that float on scroll.
	 * R stays fixed at the top. L and M drift toward it via exponential
	 * decay interpolation (RAF loop), creating a cascading wave effect.
	 * Scales down proportionally on narrower viewports.
	 * Hidden on mobile (<md breakpoint).
	 * Hamburger button at bottom toggles slide-out nav overlay (managed by parent).
	 */
	let {
		menuOpen = $bindable(false)
	}: {
		menuOpen?: boolean;
	} = $props();

	let scrollY = $state(0);
	let viewportWidth = $state(1280);
	let viewportHeight = $state(800);
	let heroHeight = $state(0);
	let reducedMotion = $state(false);

	// Damping rates: R=snappy, L=moderate, M=floaty → cascading wave
	const RATES = [8, 5, 3];

	// Responsive sizing: scale down at md (768–1023), full at lg (1024+)
	const isLarge = $derived(viewportWidth >= 1024);
	const fontSize = $derived(isLarge ? 72 : 60);
	const sidebarWidth = $derived(isLarge ? 80 : 68);
	const collapsedGap = $derived(fontSize - 6); // letters nearly touching

	// R is always fixed at the top.
	const R_TOP = $derived(isLarge ? -12 : 0);

	// Gap between letters interpolates from spread to collapsed
	const spreadGap = $derived((viewportHeight * 0.70) / 2);

	// No hero (subpages, reduced motion) → always collapsed.
	// Collapse range extends 80% beyond the hero for a slower, more cinematic feel.
	const hasHero = $derived(heroHeight > 0);
	const range = $derived(Math.max(heroHeight * 1.8, 1));
	const progress = $derived(hasHero ? Math.min(scrollY / range, 1) : 1);
	const eased = $derived(1 - (1 - progress) ** 3); // easeOutCubic

	// Current gap interpolates between spread and collapsed
	const gap = $derived(spreadGap + (collapsedGap - spreadGap) * eased);

	// Scroll-derived target positions (R stays put; L and M spaced below)
	const targetPositions = $derived([
		R_TOP,
		R_TOP + gap,
		R_TOP + gap * 2
	]);

	// Non-reactive arrays — RAF reads/writes directly (no Svelte tracking)
	let targets: number[] = [0, 0, 0];
	let current: number[] = [0, 0, 0];

	// Reactive — drives the template
	let displayPositions = $state([0, 0, 0]);

	// --- Setup effect: listeners, hero measurement, reduced motion ---
	$effect(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

	// --- Target sync: push scroll-derived positions into plain array ---
	// Declared BEFORE RAF effect — Svelte 5 runs effects in declaration order.
	$effect(() => {
		targets = targetPositions;
	});

	// --- RAF loop: exponential decay interpolation ---
	$effect(() => {
		// Snap to current targets on init (no entrance flash)
		for (let i = 0; i < 3; i++) current[i] = targets[i];
		displayPositions = [...targets];

		if (reducedMotion) return; // Snap effect below handles reduced motion

		let frameId: number;
		let last = performance.now();

		function tick(now: number) {
			const dt = Math.min((now - last) / 1000, 0.1); // Cap prevents jump after tab switch
			last = now;
			for (let i = 0; i < 3; i++) {
				current[i] += (targets[i] - current[i]) * (1 - Math.exp(-RATES[i] * dt));
			}
			displayPositions = [current[0], current[1], current[2]];
			frameId = requestAnimationFrame(tick);
		}

		frameId = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frameId);
	});

	// --- Reduced motion: snap to targets on every scroll ---
	$effect(() => {
		if (reducedMotion) {
			for (let i = 0; i < 3; i++) current[i] = targetPositions[i];
			displayPositions = [...targetPositions];
		}
	});
</script>

<aside
	class="hidden md:flex fixed top-0 left-0 h-screen z-50 bg-white dark:bg-hero"
	style="width: {sidebarWidth}px;"
>
	{#each ['R', 'L', 'M'] as letter, i}
		<span
			class="absolute font-bold select-none pointer-events-none
				left-1/2 -translate-x-1/2 text-hero dark:text-hero-foreground uppercase tracking-wide"
			style="font-size: {fontSize}px;
				top: {displayPositions[i]}px;
				will-change: top;"
			aria-hidden="true"
		>
			{letter}
		</span>
	{/each}

	<!-- Hamburger toggle — sized to match RLM letter width, same color as letters -->
	<button
		class="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-sm
			text-hero dark:text-hero-foreground hover:text-hero/80 dark:hover:text-hero-foreground/80 transition-colors"
		style="padding: {isLarge ? 6 : 4}px;"
		onclick={() => menuOpen = !menuOpen}
		aria-label={menuOpen ? 'Close menu' : 'Open menu'}
		aria-expanded={menuOpen}
	>
		<svg
			style="width: {isLarge ? 52 : 36}px; height: {isLarge ? 52 : 36}px;"
			fill="none" stroke="currentColor" viewBox="0 0 24 24"
			stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"
		>
			{#if menuOpen}
				<path d="M6 18L18 6M6 6l12 12" />
			{:else}
				<path d="M4 6h16M4 12h16M4 18h16" />
			{/if}
		</svg>
	</button>
</aside>
