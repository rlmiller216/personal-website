<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ToolCard from '$lib/components/ToolCard.svelte';
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();
</script>

<!-- Hero — full-width Space Indigo with gradient fade -->
<section class="relative -mt-16 pt-16 bg-hero overflow-hidden">
	<div class="max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-40 animate-stagger">
		<h1 class="text-4xl sm:text-5xl lg:text-7xl font-bold text-hero-foreground tracking-tight leading-[1.1] mb-6">
			{#each data.heroHeadline.split(' ') as word, i}
				{#if i >= data.heroHeadline.split(' ').length - 2}
					<span class="text-highlight">{word}</span>{' '}
				{:else}
					{word}{' '}
				{/if}
			{/each}
		</h1>
		{#if data.heroIntro}
			<p class="text-lg sm:text-xl text-hero-foreground/70 max-w-2xl leading-relaxed">
				{data.heroIntro}
			</p>
		{/if}
	</div>
	<!-- Gradient fade to background -->
	<div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
</section>

<!-- Featured Projects -->
{#if data.featuredProjects.length > 0}
	<section class="max-w-6xl mx-auto px-6 py-16">
		<div class="flex items-center justify-between mb-8">
			<h2 class="text-2xl font-bold border-l-3 border-primary pl-4">Projects</h2>
			<a href="/projects" class="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
				View all
				<ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
			{#each data.featuredProjects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	</section>
{/if}

<!-- Featured Tools -->
{#if data.featuredTools.length > 0}
	<section class="max-w-6xl mx-auto px-6 pb-16">
		<div class="flex items-center justify-between mb-8">
			<h2 class="text-2xl font-bold border-l-3 border-primary pl-4">Open Source</h2>
			<a href="/open-source" class="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
				View all
				<ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
			{#each data.featuredTools as tool}
				<ToolCard {tool} />
			{/each}
		</div>
	</section>
{/if}

<!-- Featured Resources -->
{#if data.featuredResources.length > 0}
	<section class="max-w-6xl mx-auto px-6 pb-16">
		<div class="flex items-center justify-between mb-8">
			<h2 class="text-2xl font-bold border-l-3 border-primary pl-4">Resources I Love</h2>
			<a href="/resources" class="group flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
				View all
				<ArrowRight class="w-4 h-4 transition-transform group-hover:translate-x-1" />
			</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-stagger">
			{#each data.featuredResources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	</section>
{/if}

<!-- Empty state -->
{#if data.featuredProjects.length === 0 && data.featuredTools.length === 0 && data.featuredResources.length === 0}
	<section class="max-w-6xl mx-auto px-6 py-24 text-center">
		<p class="text-lg text-muted-foreground">Content coming soon — check back shortly!</p>
	</section>
{/if}
