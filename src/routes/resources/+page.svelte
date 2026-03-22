<script lang="ts">
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Toolkit — {data.siteName}</title>
</svelte:head>

<!-- Page header — Deep Twilight, overlaps transparent nav -->
<div class="relative -mt-16 pt-16 bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-8 sm:py-10">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"><span class="text-highlight">Toolkit</span></h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if data.resources.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
			{#each data.resources as resource}
				<ResourceCard {resource} />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">Resources coming soon.</p>
	{/if}
</section>
