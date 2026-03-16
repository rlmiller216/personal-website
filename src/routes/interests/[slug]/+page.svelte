<script lang="ts">
	import NotionBlocks from '$lib/components/NotionBlocks.svelte';

	let { data } = $props();

	const allInterests = ['Poetry', 'Art', 'Music', 'Travel', 'Food'];
</script>

<svelte:head>
	<title>{data.title} — {data.siteName}</title>
</svelte:head>

<article class="max-w-3xl mx-auto px-6 py-16">
	<h1 class="text-3xl font-bold mb-8">{data.title}</h1>

	{#if data.blocks.length > 0}
		<div class="prose max-w-none">
			<NotionBlocks blocks={data.blocks} />
		</div>
	{:else}
		<p class="text-muted-foreground">Content coming soon.</p>
	{/if}

	<!-- Cross-links to other interests -->
	<nav class="mt-16 pt-8 border-t border-border">
		<p class="text-sm text-muted-foreground mb-2">More interests:</p>
		<div class="flex flex-wrap gap-3">
			{#each allInterests as interest}
				{@const slug = interest.toLowerCase()}
				{#if slug !== data.slug}
					<a href="/interests/{slug}" class="text-sm hover:underline">{interest}</a>
				{/if}
			{/each}
		</div>
	</nav>
</article>
