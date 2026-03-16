<script lang="ts">
	import type { Project } from '$lib/types/content';

	let { project }: { project: Project } = $props();
</script>

<a href={project.url || '#'} class="group block rounded-lg border border-border overflow-hidden hover:shadow-md transition-shadow" target={project.url ? '_blank' : undefined} rel={project.url ? 'noopener noreferrer' : undefined}>
	{#if project.imageUrl}
		<div class="aspect-[16/10] overflow-hidden bg-muted">
			<img
				src={project.imageUrl}
				alt={project.title}
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
				loading="lazy"
			/>
		</div>
	{:else}
		<div class="aspect-[16/10] bg-muted flex items-center justify-center text-muted-foreground text-sm">
			No image
		</div>
	{/if}
	<div class="p-4">
		<div class="flex items-center gap-2 mb-1">
			<h3 class="font-semibold">{project.title}</h3>
			{#if project.sector}
				<span class="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{project.sector}</span>
			{/if}
		</div>
		{#if project.role}
			<p class="text-sm text-muted-foreground">{project.role}</p>
		{/if}
	</div>
</a>
