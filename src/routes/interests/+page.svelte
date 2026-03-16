<script lang="ts">
	import { ArrowRight } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Interests — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo -->
<div class="bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-12">
		<h1 class="text-4xl font-bold text-hero-foreground">Interests</h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if data.interests.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
			{#each data.interests as interest}
				<a
					href="/interests/{interest.slug}"
					class="group flex items-center justify-between p-5 rounded-lg border border-border
						hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 transition-all duration-300"
				>
					<span class="text-lg font-semibold">{interest.title}</span>
					<ArrowRight class="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">Interest pages coming soon.</p>
	{/if}
</section>
