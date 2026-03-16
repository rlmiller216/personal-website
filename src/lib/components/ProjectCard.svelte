<script lang="ts">
	import type { Project } from '$lib/types/content';

	let { project }: { project: Project } = $props();
</script>

<a
	href={project.url || '#'}
	class="group block rounded-lg border border-border overflow-hidden
		hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
	target={project.url ? '_blank' : undefined}
	rel={project.url ? 'noopener noreferrer' : undefined}
>
	<!-- Image with Ultra Violet hover overlay -->
	<div class="relative aspect-[16/10] overflow-hidden bg-muted">
		{#if project.imageUrl}
			<img
				src={project.imageUrl}
				alt={project.title}
				class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
				loading="lazy"
			/>
		{:else}
			<div class="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
				No image
			</div>
		{/if}
		<div class="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
	</div>

	<!-- Content -->
	<div class="p-4">
		<div class="flex items-center gap-2 mb-1">
			<h3 class="font-semibold">{project.title}</h3>
			{#if project.sector}
				<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{project.sector}</span>
			{/if}
		</div>
		{#if project.role}
			<p class="text-sm text-muted-foreground">{project.role}</p>
		{/if}
	</div>

	<!-- Lime Yellow bottom accent — scales in on hover -->
	<div class="h-0.5 bg-secondary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
</a>
