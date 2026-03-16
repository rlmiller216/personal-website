<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ToolCard from '$lib/components/ToolCard.svelte';
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();

	/** Split headline so last 2 words get a single continuous lime underline */
	const headlineWords = $derived(data.heroHeadline.split(' '));
	const leadWords = $derived(headlineWords.slice(0, -2).join(' '));
	const highlightWords = $derived(headlineWords.slice(-2).join(' '));
</script>

<!-- Hero — full-width Space Indigo -->
<section data-hero class="relative -mt-16 pt-16 bg-hero overflow-hidden">
	<div class="max-w-6xl mx-auto px-6 py-24 sm:py-32 lg:py-40 text-center animate-stagger">
		<h1 class="mx-auto max-w-3xl text-4xl sm:text-5xl lg:text-7xl font-bold text-hero-foreground tracking-tight leading-[1.1] mb-6">
			{leadWords}<br />
			<span class="text-highlight">{highlightWords}</span>
		</h1>
		{#if data.heroIntro}
			<p class="mx-auto text-lg sm:text-xl text-hero-foreground/70 max-w-xl leading-relaxed"
				style="font-family: 'Raleway', sans-serif;">
				{data.heroIntro}
			</p>
		{/if}
	</div>
</section>

<!-- Featured Projects — White band -->
{#if data.featuredProjects.length > 0}
	<section class="w-full py-20" style="background: #FFFFFF;">
		<div class="max-w-6xl mx-auto px-6">
			<div class="mb-10 flex items-baseline justify-between">
				<h2 class="text-3xl md:text-4xl font-bold"
					style="font-family: 'Raleway', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
					FEATURED <span class="text-highlight">PROJECTS</span>
				</h2>
				<a href="/projects" class="group flex items-center gap-1 text-sm font-medium text-primary shrink-0"
					style="font-family: 'Raleway', sans-serif;">
					View all <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
				</a>
			</div>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-stagger">
				{#each data.featuredProjects as project}
					<ProjectCard {project} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Open Source — Smoke band -->
{#if data.featuredTools.length > 0}
	<section class="w-full py-20 bg-background">
		<div class="max-w-6xl mx-auto px-6">
			<div class="mb-10 flex items-baseline justify-between">
				<h2 class="text-3xl md:text-4xl font-bold"
					style="font-family: 'Raleway', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
					OPEN <span class="text-highlight">SOURCE</span>
				</h2>
				<a href="/open-source" class="group flex items-center gap-1 text-sm font-medium text-primary shrink-0"
					style="font-family: 'Raleway', sans-serif;">
					View all <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
				</a>
			</div>
			<div class="grid gap-6 sm:grid-cols-2 animate-stagger">
				{#each data.featuredTools as tool}
					<ToolCard {tool} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Recommended Resources — White band -->
{#if data.featuredResources.length > 0}
	<section class="w-full py-20" style="background: #FFFFFF;">
		<div class="max-w-6xl mx-auto px-6">
			<div class="mb-10 flex items-baseline justify-between">
				<h2 class="text-3xl md:text-4xl font-bold"
					style="font-family: 'Raleway', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
					RECOMMENDED <span class="text-highlight">RESOURCES</span>
				</h2>
				<a href="/resources" class="group flex items-center gap-1 text-sm font-medium text-primary shrink-0"
					style="font-family: 'Raleway', sans-serif;">
					View all <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-1" />
				</a>
			</div>
			<div class="grid gap-5 sm:grid-cols-2 animate-stagger">
				{#each data.featuredResources as resource}
					<ResourceCard {resource} />
				{/each}
			</div>
		</div>
	</section>
{/if}

<!-- Empty state -->
{#if data.featuredProjects.length === 0 && data.featuredTools.length === 0 && data.featuredResources.length === 0}
	<section class="max-w-6xl mx-auto px-6 py-24 text-center">
		<p class="text-lg text-muted-foreground">Content coming soon — check back shortly!</p>
	</section>
{/if}
