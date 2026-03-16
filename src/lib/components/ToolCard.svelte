<script lang="ts">
	import type { Tool } from '$lib/types/content';

	let { tool }: { tool: Tool } = $props();
</script>

<div class="rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
	{#if tool.tags.length > 0}
		<div class="flex flex-wrap gap-1.5 mb-3">
			{#each tool.tags as tag}
				<span class="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{tag}</span>
			{/each}
		</div>
	{/if}

	<h3 class="font-semibold mb-1">{tool.title}</h3>

	{#if tool.description}
		<p class="text-sm text-muted-foreground line-clamp-3 mb-3">{tool.description}</p>
	{/if}

	<div class="flex gap-4 text-sm">
		{#if tool.githubUrl}
			<a href={tool.githubUrl} class="text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
				GitHub &rarr;
			</a>
		{/if}
		{#if tool.demoUrl}
			<a href={tool.demoUrl} class="text-foreground hover:underline" target="_blank" rel="noopener noreferrer">
				Demo &rarr;
			</a>
		{/if}
	</div>
</div>
