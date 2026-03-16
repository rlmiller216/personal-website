<script lang="ts">
	import type { Resource } from '$lib/types/content';

	let { resource }: { resource: Resource } = $props();
</script>

<a
	href={resource.url || '#'}
	class="flex gap-4 rounded-lg border border-border border-l-3 border-l-primary p-4
		hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
	target={resource.url ? '_blank' : undefined}
	rel={resource.url ? 'noopener noreferrer' : undefined}
>
	{#if resource.imageUrl}
		<img
			src={resource.imageUrl}
			alt={resource.title}
			class="w-12 h-16 object-cover rounded shrink-0"
			loading="lazy"
		/>
	{:else}
		<div class="w-12 h-16 bg-primary/10 rounded shrink-0 flex items-center justify-center text-xs text-primary font-bold">
			{resource.type?.charAt(0) || '?'}
		</div>
	{/if}
	<div class="min-w-0">
		{#if resource.type}
			<span class="text-xs font-medium text-primary uppercase tracking-wide">{resource.type}</span>
		{/if}
		<h3 class="font-semibold text-sm leading-tight">{resource.title}</h3>
		{#if resource.author}
			<p class="text-xs text-muted-foreground">by {resource.author}</p>
		{/if}
		{#if resource.whyILoveIt}
			<p class="text-xs text-muted-foreground italic mt-1 line-clamp-2 bg-secondary/15 px-1.5 py-0.5 rounded">"{resource.whyILoveIt}"</p>
		{/if}
	</div>
</a>
