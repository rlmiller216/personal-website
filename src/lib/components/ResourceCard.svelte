<script lang="ts">
	import type { Resource } from '$lib/types/content';

	let { resource }: { resource: Resource } = $props();
</script>

<a
	href={`/resources/${resource.slug}`}
	class="flex items-start gap-4 rounded-lg p-4 transition-shadow hover:shadow-md bg-card border border-border border-l-4 border-l-primary"
>
	{#if resource.imageUrl}
		<img
			src={resource.imageUrl}
			alt={resource.title}
			class="h-20 w-16 shrink-0 rounded object-cover"
			loading="lazy"
		/>
	{:else}
		<div class="w-16 h-20 bg-primary/10 rounded shrink-0 flex items-center justify-center text-xs text-primary font-bold">
			{resource.type?.charAt(0) || '?'}
		</div>
	{/if}
	<div class="flex flex-1 flex-col">
		{#if resource.type}
			<span class="mb-1 w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider bg-secondary text-secondary-foreground">{resource.type}</span>
		{/if}
		<h3 class="text-base font-semibold font-body">{resource.title}</h3>
		{#if resource.author}
			<p class="text-xs text-muted-foreground">{resource.author}</p>
		{/if}
		{#if resource.whyILoveIt}
			<p class="mt-1.5 text-sm italic text-muted-foreground">&ldquo;{resource.whyILoveIt}&rdquo;</p>
		{/if}
	</div>
</a>
