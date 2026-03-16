<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Projects — {data.siteName}</title>
</svelte:head>

<section class="max-w-6xl mx-auto px-6 py-16">
	<h1 class="text-3xl font-bold mb-8">Projects</h1>

	{#if data.projects.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each data.projects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">Projects coming soon.</p>
	{/if}
</section>
