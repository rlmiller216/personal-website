<script lang="ts">
	import type { Tool } from '$lib/types/content';

	let { tool }: { tool: Tool } = $props();
</script>

<a href={`/open-source/${tool.slug}`} class="block overflow-hidden rounded-lg shadow-sm transition-shadow hover:shadow-lg no-underline text-inherit">
	<!-- Violet header bar with Bodoni Moda title -->
	<div class="px-5 py-3 bg-primary">
		<h3 class="text-lg font-semibold text-primary-foreground">{tool.title}</h3>
	</div>
	<!-- White body -->
	<div class="p-5 bg-card">
		{#if tool.description}
			<p class="text-sm text-muted-foreground">{tool.description}</p>
		{/if}
		{#if tool.tags.length > 0}
			<div class="mt-4 flex flex-wrap gap-2">
				{#each tool.tags as tag}
					<span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>
