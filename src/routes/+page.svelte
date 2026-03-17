<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ToolListItem from '$lib/components/ToolListItem.svelte';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import StickySection from '$lib/components/StickySection.svelte';

	let { data } = $props();

	/**
	 * Split headline into three typographic parts: lead / bridge / highlight.
	 * "Science for the Greater Good" → "Science" / "for the" / "Greater Good"
	 * The bridge ("for the") renders smaller and faded as a visual connector.
	 */
	const BRIDGE_WORDS = ['for', 'the', 'of', 'and', 'in', 'to', 'a', 'an'];
	const headlineWords = $derived(data.heroHeadline.split(' '));
	const bridgeStart = $derived(headlineWords.findIndex(w => BRIDGE_WORDS.includes(w.toLowerCase())));
	const highlightStart = $derived(
		bridgeStart >= 0
			? headlineWords.findIndex((w, i) => i > bridgeStart && !BRIDGE_WORDS.includes(w.toLowerCase()))
			: -1
	);
	const leadWords = $derived(bridgeStart > 0 ? headlineWords.slice(0, bridgeStart).join(' ') : '');
	const bridgeWords = $derived(
		bridgeStart >= 0 && highlightStart > bridgeStart
			? headlineWords.slice(bridgeStart, highlightStart).join(' ')
			: ''
	);
	const highlightWords = $derived(
		highlightStart >= 0 ? headlineWords.slice(highlightStart).join(' ') : data.heroHeadline
	);

	// Feature card logic — must be $derived in script, not {@const} in template
	const firstProject = $derived(data.featuredProjects[0]);
	const hasFeatureImage = $derived(firstProject?.imageUrl);
	const gridProjects = $derived(
		hasFeatureImage ? data.featuredProjects.slice(1) : data.featuredProjects
	);
</script>

<!-- Hero — full-width Deep Twilight -->
<section data-hero class="relative -mt-16 pt-16 bg-hero overflow-hidden">
	<div class="max-w-6xl mx-auto px-6 pt-20 pb-28 sm:pt-24 sm:pb-36 lg:pt-32 lg:pb-48 text-center animate-stagger">
		<h1 class="mx-auto max-w-3xl text-5xl md:text-6xl lg:text-[5.5rem] font-bold text-hero-foreground leading-[1] mb-6">
			{#if bridgeWords}
				<span class="block tracking-[0.04em]">{leadWords}</span>
				<span class="block text-[0.65em] opacity-50 font-normal tracking-[0.05em] -mt-[0.05em] -mb-[0.1em]">{bridgeWords}</span>
				<span class="text-highlight block tracking-[0.04em]">{highlightWords}</span>
			{:else}
				{leadWords}<br />
				<span class="text-highlight">{highlightWords}</span>
			{/if}
		</h1>
		{#if data.heroIntro}
			<p class="mx-auto text-lg sm:text-xl text-hero-foreground/70 max-w-xl leading-relaxed">
				{data.heroIntro}
			</p>
		{/if}
	</div>
</section>

<!-- Featured Projects — White band with feature card + grid -->
{#if data.featuredProjects.length > 0}
	<StickySection title="FEATURED" highlightWord="PROJECTS" href="/projects" variant="muted">
		<!-- Feature card: only if first project has an image -->
		{#if hasFeatureImage}
			<a
				href={'/projects/' + firstProject.slug}
				class="group block relative overflow-hidden rounded-lg mb-8"
			>
				<!-- No loading="lazy" — feature card is above the fold -->
				<img
					src={firstProject.imageUrl}
					alt={firstProject.title}
					class="w-full h-64 sm:h-80 lg:h-96 object-cover transition-transform duration-300 group-hover:scale-105"
				/>
				<!-- Deep Twilight gradient overlay — uses site palette, not generic black -->
				<div
					class="absolute inset-0"
					style="background: linear-gradient(to top, oklch(0.15 0.04 270 / 75%), oklch(0.15 0.04 270 / 20%), transparent);"
				></div>
				<div class="absolute bottom-0 left-0 p-6 text-white">
					<h3 class="text-xl sm:text-2xl font-bold font-body">
						{firstProject.title}
					</h3>
					{#if firstProject.description}
						<p class="mt-1 text-sm text-white/80 max-w-lg">{firstProject.description}</p>
					{/if}
					{#if firstProject.sector.length > 0 || firstProject.tags.length > 0}
						<div class="mt-2 flex flex-wrap gap-1">
							{#each firstProject.sector as s}
								<span class="rounded-full px-2 py-px text-[0.65rem] font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">{s}</span>
							{/each}
							{#each firstProject.tags as tag}
								<span class="rounded-full px-2 py-px text-[0.65rem] font-medium bg-secondary text-secondary-foreground">{tag}</span>
							{/each}
						</div>
					{/if}
				</div>
			</a>
		{/if}

		<!-- Remaining projects in grid (or all projects if no feature image) -->
		{#if gridProjects.length > 0}
			<div class="grid gap-6 sm:grid-cols-2 {gridProjects.length >= 3 ? 'lg:grid-cols-3' : ''} animate-stagger">
				{#each gridProjects as project}
					<ProjectCard {project} />
				{/each}
			</div>
		{/if}
	</StickySection>
{/if}

<!-- Open Source — Muted band with list items -->
{#if data.featuredTools.length > 0}
	<StickySection title="OPEN" highlightWord="SOURCE" href="/open-source" variant="white">
		<div class="grid gap-6 sm:grid-cols-2 animate-stagger">
			{#each data.featuredTools as tool}
				<ToolListItem {tool} />
			{/each}
		</div>
	</StickySection>
{/if}

<!-- Toolkit — White band with card grid -->
{#if data.featuredResources.length > 0}
	<StickySection title="" highlightWord="TOOLKIT" href="/resources" variant="muted">
		<div class="grid gap-6 sm:grid-cols-2 animate-stagger">
			{#each data.featuredResources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	</StickySection>
{/if}

<!-- Empty state -->
{#if data.featuredProjects.length === 0 && data.featuredTools.length === 0 && data.featuredResources.length === 0}
	<section class="max-w-6xl mx-auto px-6 py-24 text-center">
		<p class="text-lg text-muted-foreground">Content coming soon — check back shortly!</p>
	</section>
{/if}
