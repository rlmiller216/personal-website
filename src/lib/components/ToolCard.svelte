<script lang="ts">
	import type { Tool } from '$lib/types/content';

	let { tool }: { tool: Tool } = $props();
</script>

<div class="overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-lg">
	<!-- Violet header bar with Bodoni Moda title -->
	<div class="px-5 py-3 bg-primary">
		<h3 class="text-lg font-semibold text-primary-foreground"
			style="font-family: 'Bodoni Moda', serif;">{tool.title}</h3>
	</div>
	<!-- White body -->
	<div class="p-5 bg-card">
		{#if tool.description}
			<p class="text-sm text-muted-foreground" style="font-family: 'Raleway', sans-serif;">{tool.description}</p>
		{/if}
		{#if tool.tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each tool.tags as tag}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
						style="font-family: 'Raleway', sans-serif;">{tag}</span>
				{/each}
			</div>
		{/if}
		<div class="mt-4 flex gap-4">
			{#if tool.githubUrl}
				<a href={tool.githubUrl} class="text-sm font-medium text-primary hover:underline underline-offset-2"
					style="font-family: 'Raleway', sans-serif;"
					target="_blank" rel="noopener noreferrer">GitHub</a>
			{/if}
			{#if tool.demoUrl}
				<a href={tool.demoUrl} class="text-sm font-medium text-primary hover:underline underline-offset-2"
					style="font-family: 'Raleway', sans-serif;"
					target="_blank" rel="noopener noreferrer">Demo</a>
			{/if}
		</div>
	</div>
</div>
