<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { Project } from '$lib/types/content';

	let { project }: { project: Project } = $props();
</script>

<a
	href={`/projects/${project.slug}`}
	class="group flex flex-col overflow-hidden rounded-lg shadow-sm transition-all
		hover:shadow-lg hover:-translate-y-1 border-b-4 border-b-secondary"
>
	{#if project.imageUrl}
		<img
			src={project.imageUrl}
			alt={project.title}
			class="h-48 w-full object-cover"
			loading="lazy"
		/>
	{:else}
		<div class="h-48 w-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
			No image
		</div>
	{/if}
	<div class="flex flex-1 flex-col p-5 bg-card">
		{#if project.sector}
			<span class="mb-2 w-fit rounded-full px-3 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">{project.sector}</span>
		{/if}
		<h3 class="text-lg font-semibold font-body">{project.title}</h3>
		{#if project.description}
			<p class="mt-1 flex-1 text-sm text-muted-foreground">{project.description}</p>
		{/if}
		{#if project.role}
			<span class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
				{project.role} <ArrowRight class="h-3.5 w-3.5" />
			</span>
		{/if}
	</div>
</a>
