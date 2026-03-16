<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import type { Tool } from '$lib/types/content';

	let { tool }: { tool: Tool } = $props();
</script>

<!-- List-item layout for tools — Ultra Violet left border, hover highlight, reveal arrow -->
<a
	href={`/open-source/${tool.slug}`}
	class="group flex items-start gap-5 py-5 rounded-lg
		transition-colors duration-300 hover:bg-accent"
	style="border-left: 3px solid oklch(0.47 0.29 285); padding-left: 1rem;"
>
	<div class="flex-1 min-w-0">
		<h3
			class="text-lg font-semibold group-hover:text-primary transition-colors"
			style="font-family: 'Raleway', sans-serif;"
		>
			{tool.title}
		</h3>
		{#if tool.description}
			<p
				class="mt-1 text-sm text-muted-foreground"
				style="font-family: 'Raleway', sans-serif; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;"
			>
				{tool.description}
			</p>
		{/if}
		{#if tool.tags.length > 0}
			<div class="mt-2 flex flex-wrap gap-2">
				{#each tool.tags.slice(0, 4) as tag}
					<span
						class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground"
						style="font-family: 'Raleway', sans-serif;"
					>
						{tag}
					</span>
				{/each}
			</div>
		{/if}
	</div>
	<ArrowRight
		class="shrink-0 h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100
			transition-opacity self-center"
	/>
</a>
