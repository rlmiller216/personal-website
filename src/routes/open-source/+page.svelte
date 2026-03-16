<script lang="ts">
	import ToolCard from '$lib/components/ToolCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Open Source — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">Open Source</h1>
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
