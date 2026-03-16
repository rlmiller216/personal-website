<script lang="ts">
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();

	const sections = $derived(Object.entries(data.grouped));
</script>

<svelte:head>
	<title>Resources — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">Resources</h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if sections.length > 0}
		{#each sections as [type, resources]}
			<div class="mb-12">
				<h2 class="text-2xl md:text-3xl font-bold mb-5"
				style="font-family: 'Raleway', sans-serif; text-transform: uppercase; letter-spacing: 0.05em;">
				{type} <span class="text-muted-foreground text-lg font-normal">({resources.length})</span>
			</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
					{#each resources as resource}
						<ResourceCard {resource} />
					{/each}
				</div>
			</div>
		{/each}
	{:else}
		<p class="text-muted-foreground">Resources coming soon.</p>
	{/if}
</section>
