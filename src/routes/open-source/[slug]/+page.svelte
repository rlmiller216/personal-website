<script lang="ts">
  import DetailHeader from '$lib/components/DetailHeader.svelte';
  import NotionBlocks from '$lib/components/NotionBlocks.svelte';

  let { data } = $props();
  const tool = $derived(data.tool);
  const blocks = $derived(data.blocks);
</script>

<svelte:head>
  <title>{tool.title} — {data.siteName}</title>
  {#if tool.description}
    <meta name="description" content={tool.description} />
  {/if}
  <meta property="og:title" content="{tool.title} — {data.siteName}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://rlmiller.netlify.app/open-source/{tool.slug}" />
  {#if tool.description}
    <meta property="og:description" content={tool.description} />
  {/if}
</svelte:head>

<DetailHeader backHref="/open-source" backLabel="All Open Source" title={tool.title}>
  {#if tool.category}
    <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">
      {tool.category}
    </span>
  {/if}
</DetailHeader>

<article class="max-w-3xl mx-auto px-6 py-12 animate-stagger">
  {#if tool.tags.length > 0}
    <div class="flex flex-wrap gap-2 mb-8">
      {#each tool.tags as tag}
        <span class="rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
          {tag}
        </span>
      {/each}
    </div>
  {/if}

  {#if tool.description}
    <p class="text-lg text-muted-foreground leading-relaxed mb-8">
      {tool.description}
    </p>
  {/if}

  {#if blocks.length > 0}
    <div class="prose max-w-none">
      <NotionBlocks {blocks} />
    </div>
  {/if}

  {#if tool.githubUrl || tool.demoUrl}
    <div class="mt-12 pt-8 border-t border-border flex flex-wrap gap-4">
      {#if tool.githubUrl}
        <a
          href={tool.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
            font-medium rounded-lg transition-all duration-200 hover:opacity-90"
        >
          View on GitHub
          <svg class="h-4 w-4 transition-transform duration-200 hover:translate-x-1" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      {/if}
      {#if tool.demoUrl}
        <a
          href={tool.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 px-6 py-3 border-2 border-primary text-primary
            font-medium rounded-lg transition-all duration-200 hover:bg-primary/5"
        >
          Live Demo
          <svg class="h-4 w-4 transition-transform duration-200 hover:translate-x-1" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
      {/if}
    </div>
  {/if}
</article>
