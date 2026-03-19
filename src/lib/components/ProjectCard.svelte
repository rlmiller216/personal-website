<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import CardMedia from '$lib/components/CardMedia.svelte';
	import type { Project } from '$lib/types/content';

	let { project }: { project: Project } = $props();
</script>

<a
	href={`/projects/${project.slug}`}
	class="group flex flex-col overflow-hidden rounded-lg shadow-sm transition-all
		hover:shadow-lg hover:-translate-y-1 border-b-4 border-b-secondary"
>
	{#if project.imageUrl}
		<CardMedia
			src={project.imageUrl}
			poster={project.posterUrl}
			alt={project.title}
			isVideo={project.isVideo}
			class="h-48 w-full object-cover"
		/>
	{:else}
		<div class="h-48 w-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
			No image
		</div>
	{/if}
	<div class="flex flex-1 flex-col p-5 bg-card">
		<h3 class="text-lg font-semibold font-body inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
			{project.title}
			<ArrowRight class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
		</h3>
		{#if project.description}
			<p class="mt-1 flex-1 text-sm font-medium text-muted-foreground">{project.description}</p>
		{/if}
		{#if project.sector.length > 0 || project.tags.length > 0}
			<div class="mt-3 flex flex-wrap gap-1">
				{#each project.sector as s}
					<span class="rounded-full px-2 py-px text-[0.65rem] font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">{s}</span>
				{/each}
				{#each project.tags as tag}
					<span class="rounded-full px-2 py-px text-[0.65rem] font-medium bg-secondary text-secondary-foreground">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>
