<script lang="ts">
	import NotionBlocks from '$lib/components/NotionBlocks.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>About — {data.siteName}</title>
</svelte:head>

<article class="max-w-3xl mx-auto px-6 py-16">
	<h1 class="text-3xl font-bold mb-8">About</h1>

	{#if data.blocks.length > 0}
		<div class="prose max-w-none">
			<NotionBlocks blocks={data.blocks} />
		</div>
	{:else}
		<p class="text-muted-foreground">About content coming soon.</p>
	{/if}
</article>
