<script lang="ts">
	import type { Resource } from '$lib/types/content';

	let { resource }: { resource: Resource } = $props();
</script>

<a href={resource.url || '#'} class="flex gap-4 rounded-lg border border-border p-4 hover:shadow-md transition-shadow" target={resource.url ? '_blank' : undefined} rel={resource.url ? 'noopener noreferrer' : undefined}>
	{#if resource.imageUrl}
		<img
			src={resource.imageUrl}
			alt={resource.title}
			class="w-12 h-16 object-cover rounded shrink-0"
			loading="lazy"
		/>
	{:else}
		<div class="w-12 h-16 bg-muted rounded shrink-0 flex items-center justify-center text-xs text-muted-foreground">
			{resource.type?.charAt(0) || '?'}
		</div>
	{/if}
	<div class="min-w-0">
		{#if resource.type}
			<span class="text-xs text-muted-foreground">{resource.type}</span>
		{/if}
		<h3 class="font-semibold text-sm leading-tight">{resource.title}</h3>
		{#if resource.author}
			<p class="text-xs text-muted-foreground">by {resource.author}</p>
		{/if}
		{#if resource.whyILoveIt}
			<p class="text-xs text-muted-foreground italic mt-1 line-clamp-2">"{resource.whyILoveIt}"</p>
		{/if}
	</div>
</a>
