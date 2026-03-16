<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Interests — {data.siteName}</title>
</svelte:head>

<section class="max-w-3xl mx-auto px-6 py-16">
	<h1 class="text-3xl font-bold mb-8">Interests</h1>

	{#if data.interests.length > 0}
		<ul class="space-y-3">
			{#each data.interests as interest}
				<li>
					<a href="/interests/{interest.slug}" class="text-lg hover:underline">
						{interest.title}
					</a>
				</li>
			{/each}
		</ul>
	{:else}
		<p class="text-muted-foreground">Interest pages coming soon.</p>
	{/if}
</section>
