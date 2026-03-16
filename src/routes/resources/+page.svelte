<script lang="ts">
	import ResourceCard from '$lib/components/ResourceCard.svelte';

	let { data } = $props();

	/** Display order for resource type sections. Unlisted types appear at the end alphabetically. */
	const TYPE_ORDER = ['Website', 'Book', 'Podcast', 'Course', 'Newsletter'];

	const sections = $derived(
		Object.entries(data.grouped).sort(([a], [b]) => {
			const ia = TYPE_ORDER.indexOf(a);
			const ib = TYPE_ORDER.indexOf(b);
			// Both known → sort by defined order; unknown types go to end alphabetically
			if (ia >= 0 && ib >= 0) return ia - ib;
			if (ia >= 0) return -1;
			if (ib >= 0) return 1;
			return a.localeCompare(b);
		})
	);

	/** Pluralize resource type labels for section headers. */
	const PLURAL_MAP: Record<string, string> = {
		'Book': 'Books',
		'Website': 'Websites',
		'Podcast': 'Podcasts',
		'Course': 'Courses',
		'Newsletter': 'Newsletters'
	};

	function pluralize(type: string): string {
		return PLURAL_MAP[type] ?? `${type}s`;
	}
</script>

<svelte:head>
	<title>Toolkit — {data.siteName}</title>
</svelte:head>

<!-- Page header — Space Indigo, overlaps transparent nav -->
<div class="relative -mt-16 pt-16 bg-hero">
	<div class="max-w-6xl mx-auto px-6 py-8 sm:py-10">
		<h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"><span class="text-highlight">Toolkit</span></h1>
	</div>
</div>

<section class="max-w-6xl mx-auto px-6 py-12">
	{#if sections.length > 0}
		{#each sections as [type, resources]}
			<div class="mb-12">
				<h2 class="text-2xl md:text-3xl font-bold mb-5 font-body uppercase tracking-wide">
				{pluralize(type)} <span class="text-muted-foreground text-lg font-normal">({resources.length})</span>
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
