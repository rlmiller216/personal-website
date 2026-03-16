<script lang="ts">
	import NotionBlocks from '$lib/components/NotionBlocks.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>About — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-3xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">About</h1>
	</div>
</div>

<article class="max-w-3xl mx-auto px-6 py-12">
	{#if data.blocks.length > 0}
		<div class="prose max-w-none">
			<NotionBlocks blocks={data.blocks} />
		</div>
	{:else}
		<p class="text-muted-foreground">About content coming soon.</p>
	{/if}
</article>
