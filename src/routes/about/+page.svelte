<script lang="ts">
	import NotionBlocks from '$lib/components/NotionBlocks.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>About — {data.siteName}</title>
</svelte:head>

<!-- Page header — Deep Twilight, overlaps transparent nav -->
<div class="relative -mt-16 pt-16 bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-8 sm:py-10">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"><span class="text-highlight">About</span></h1>
	</div>
</div>

<article class="max-w-6xl mx-auto px-6 pt-2 sm:pt-6 pb-12">
	{#if data.blocks.length > 0}
		<div class="prose max-w-none [&>*:first-child]:mt-0">
			<NotionBlocks blocks={data.blocks} />
		</div>
	{:else}
		<p class="text-muted-foreground">About content coming soon.</p>
	{/if}
</article>
