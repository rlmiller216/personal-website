<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { Tool } from '$lib/types/content';

	let { tool }: { tool: Tool } = $props();
</script>

<a
	href={`/open-source/${tool.slug}`}
	class="group flex flex-col overflow-hidden rounded-lg shadow-sm transition-all
		hover:shadow-lg hover:-translate-y-1 bg-card border border-border"
>
	{#if tool.imageUrl}
		<img
			src={tool.imageUrl}
			alt={tool.title}
			class="h-44 w-full object-cover"
			loading="lazy"
		/>
	{:else}
		<div class="h-44 w-full flex items-center justify-center bg-muted/40">
			<span class="text-4xl text-muted-foreground/40">&#60;/&#62;</span>
		</div>
	{/if}
	<div class="flex flex-1 flex-col p-5">
		<h3 class="text-lg font-semibold font-body inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
			{tool.title}
			<ArrowRight class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
		</h3>
		{#if tool.description}
			<p class="mt-1 flex-1 text-sm text-muted-foreground line-clamp-3">{tool.description}</p>
		{/if}
		{#if tool.tags.length > 0 || tool.category}
			<div class="mt-3 flex flex-wrap gap-1.5">
				{#if tool.category}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10">{tool.category}</span>
				{/if}
				{#each tool.tags as tag}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>
