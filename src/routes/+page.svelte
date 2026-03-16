<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ToolListItem from '$lib/components/ToolListItem.svelte';
	import ResourceCard from '$lib/components/ResourceCard.svelte';
	import StickySection from '$lib/components/StickySection.svelte';

	let { data } = $props();

	/** Split headline so last 2 words get a single continuous lime underline */
	const headlineWords = $derived(data.heroHeadline.split(' '));
	const leadWords = $derived(headlineWords.slice(0, -2).join(' '));
	const highlightWords = $derived(headlineWords.slice(-2).join(' '));

	// Feature card logic — must be $derived in script, not {@const} in template
	const firstProject = $derived(data.featuredProjects[0]);
	const hasFeatureImage = $derived(firstProject?.imageUrl);
	const gridProjects = $derived(
		hasFeatureImage ? data.featuredProjects.slice(1) : data.featuredProjects
	);
</script>

<!-- Hero — full-width Space Indigo -->
<section data-hero class="relative -mt-16 pt-16 bg-hero overflow-hidden">
	<div class="max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-40 text-center animate-stagger">
		<h1 class="mx-auto max-w-3xl text-4xl sm:text-5xl lg:text-7xl font-bold text-hero-foreground tracking-tight leading-[1.1] mb-6">
			{leadWords}<br />
			<span class="text-highlight">{highlightWords}</span>
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
				<!-- Space Indigo gradient overlay — uses site palette, not generic black -->
				<div
					class="absolute inset-0"
					style="background: linear-gradient(to top, oklch(0.15 0.04 270 / 75%), oklch(0.15 0.04 270 / 20%), transparent);"
				></div>
				<div class="absolute bottom-0 left-0 p-6 text-white">
					{#if firstProject.sector}
						<span class="mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
							{firstProject.sector}
						</span>
					{/if}
					<h3 class="text-xl sm:text-2xl font-bold font-body">
						{firstProject.title}
					</h3>
					{#if firstProject.description}
						<p class="mt-1 text-sm text-white/80 max-w-lg">{firstProject.description}</p>
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

<!-- Recommended Resources — White band with card grid -->
{#if data.featuredResources.length > 0}
	<StickySection title="RESOURCE" highlightWord="LIBRARY" href="/resources" variant="muted">
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
