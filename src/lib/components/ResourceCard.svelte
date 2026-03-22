<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';
	import CardMedia from '$lib/components/CardMedia.svelte';
	import type { Resource } from '$lib/types/content';

	let { resource }: { resource: Resource } = $props();
</script>

<a
	href={`/resources/${resource.slug}`}
	class="group flex items-start gap-5 rounded-lg p-5 transition-all hover:shadow-md hover:-translate-y-1 bg-card border border-border border-b-4 border-b-secondary"
>
	{#if resource.imageUrl}
		<CardMedia
			src={resource.imageUrl}
			poster={resource.posterUrl}
			alt={resource.title}
			isVideo={resource.isVideo}
			class="h-28 w-20 shrink-0 rounded object-cover"
		/>
	{:else}
		<div class="w-20 h-28 bg-primary/10 rounded shrink-0 flex items-center justify-center text-sm text-primary font-bold">
			{resource.type?.charAt(0) || '?'}
		</div>
	{/if}
	<div class="flex flex-1 flex-col">
		<h3 class="text-lg font-semibold font-body inline-flex items-center gap-1.5 group-hover:text-primary transition-colors">
			{resource.title}
			<ArrowRight class="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
		</h3>
		{#if resource.description}
			<p class="text-sm font-medium text-muted-foreground">{resource.description}</p>
		{/if}
		{#if resource.whyILoveIt}
			<p class="mt-2 flex-1 text-base font-medium italic text-muted-foreground">&ldquo;{resource.whyILoveIt}&rdquo;</p>
		{/if}
		{#if resource.type || resource.category}
			<div class="mt-3 flex flex-wrap gap-1">
				{#if resource.type}
					<span class="rounded-full px-2 py-px text-[0.65rem] font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">{resource.type}</span>
				{/if}
				{#if resource.category}
					<span class="rounded-full px-2 py-px text-[0.65rem] font-medium bg-secondary text-secondary-foreground">{resource.category}</span>
				{/if}
			</div>
		{/if}
	</div>
</a>
