<script lang="ts">
	import ProjectCard from '$lib/components/ProjectCard.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Professional Projects — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo, overlaps transparent nav -->
<div class="relative -mt-16 pt-16 bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-8 sm:py-10">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"
			style="font-family: 'Bodoni Moda', serif;">Professional <span class="text-highlight">Projects</span></h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if data.projects.length > 0}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-stagger">
			{#each data.projects as project}
				<ProjectCard {project} />
			{/each}
		</div>
	{:else}
		<p class="text-muted-foreground">Projects coming soon.</p>
	{/if}
</section>
