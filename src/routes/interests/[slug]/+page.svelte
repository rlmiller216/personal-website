<script lang="ts">
	import NotionBlocks from '$lib/components/NotionBlocks.svelte';

	let { data } = $props();

	const allInterests = ['Poetry', 'Art', 'Music', 'Travel', 'Food'];
</script>

<svelte:head>
	<title>{data.title} — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-3xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">{data.title}</h1>
	</div>
</div>

<article class="max-w-3xl mx-auto px-6 py-12">
	{#if data.blocks.length > 0}
		<div class="prose max-w-none">
			<NotionBlocks blocks={data.blocks} />
		</div>
	{:else}
		<p class="text-muted-foreground">Content coming soon.</p>
	{/if}

	<!-- Cross-links to other interests -->
	<nav class="mt-16 pt-8 border-t border-border">
		<p class="text-sm text-muted-foreground mb-3">More interests:</p>
		<div class="flex flex-wrap gap-2">
			{#each allInterests as interest}
				{@const slug = interest.toLowerCase()}
				{#if slug !== data.slug}
					<a
						href="/interests/{slug}"
						class="px-4 py-1.5 text-sm font-medium rounded-full bg-accent text-accent-foreground
							hover:bg-primary hover:text-primary-foreground transition-colors"
					>
						{interest}
					</a>
				{/if}
			{/each}
		</div>
	</nav>
</article>
