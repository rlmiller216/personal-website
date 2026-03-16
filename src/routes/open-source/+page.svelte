<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Open Source — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo, overlaps transparent nav -->
<div class="relative -mt-16 pt-16 bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-8 sm:py-10">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"
			style="font-family: 'Bodoni Moda', serif;">Open <span class="text-highlight">Source</span></h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if data.tools.length > 0}
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-stagger">
			{#each data.tools as tool}
				<ToolCard {tool} />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">Open source tools coming soon.</p>
	{/if}
</section>
