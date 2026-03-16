<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';
	import ToolCard from '$lib/components/ToolCard.svelte';
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();
</script>

<!-- Hero -->
<section class="max-w-6xl mx-auto px-6 py-16">
	<h1 class="text-3xl sm:text-4xl font-bold mb-2">{data.heroHeadline}</h1>
	{#if data.heroIntro}
		<p class="text-lg text-muted-foreground">{data.heroIntro}</p>
	{/if}
</section>

<!-- Featured Projects -->
{#if data.featuredProjects.length > 0}
	<section class="max-w-6xl mx-auto px-6 pb-16">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold">Projects</h2>
			<a href="/projects" class="text-sm text-muted-foreground hover:text-foreground transition-colors">View all &rarr;</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.featuredProjects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	</section>
{/if}

<!-- Featured Tools -->
{#if data.featuredTools.length > 0}
	<section class="max-w-6xl mx-auto px-6 pb-16">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold">Open Source</h2>
			<a href="/open-source" class="text-sm text-muted-foreground hover:text-foreground transition-colors">View all &rarr;</a>
		</div>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			{#each data.featuredTools as tool}
				<ToolCard {tool} />
			{/each}
		</div>
	</section>
{/if}

<!-- Featured Resources -->
{#if data.featuredResources.length > 0}
	<section class="max-w-6xl mx-auto px-6 pb-16">
		<div class="flex items-center justify-between mb-6">
			<h2 class="text-xl font-semibold">Resources I Love</h2>
			<a href="/resources" class="text-sm text-muted-foreground hover:text-foreground transition-colors">View all &rarr;</a>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each data.featuredResources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	</section>
{/if}

<!-- Empty state -->
{#if data.featuredProjects.length === 0 && data.featuredTools.length === 0 && data.featuredResources.length === 0}
	<section class="max-w-6xl mx-auto px-6 pb-16 text-center">
		<p class="text-muted-foreground">Content coming soon — check back shortly!</p>
	</section>
{/if}
