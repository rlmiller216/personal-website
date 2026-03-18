<script lang="ts">
  import DetailHeader from '$lib/components/DetailHeader.svelte';
  import NotionBlocks from '$lib/components/NotionBlocks.svelte';

  let { data } = $props();
  const resource = $derived(data.resource);
  const blocks = $derived(data.blocks);
</script>

<svelte:head>
  <title>{resource.title} — {data.siteName}</title>
  <meta property="og:title" content="{resource.title} — {data.siteName}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://rlmiller.netlify.app/resources/{resource.slug}" />
  {#if resource.whyILoveIt}
    <meta property="og:description" content={resource.whyILoveIt} />
  {/if}
  {#if resource.imageUrl}
    <meta property="og:image" content={resource.imageUrl} />
  {/if}
</svelte:head>

<DetailHeader backHref="/resources" backLabel="All Resources" title={resource.title} description={resource.description}>
  {#if resource.type}
    <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">
      {resource.type}
    </span>
  {/if}
  {#if resource.category}
    <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent">
      {resource.category}
    </span>
  {/if}
  {#if resource.author}
    <span class="text-sm text-hero-foreground/60">
      by {resource.author}
    </span>
  {/if}
</DetailHeader>

<article class="max-w-6xl mx-auto px-6 py-12 animate-stagger">
  {#if resource.whyILoveIt}
    <blockquote
      class="border-l-4 border-primary bg-primary/5 py-6 px-8 rounded-r-lg mb-8"
    >
      <p class="text-xl text-foreground/90 italic leading-relaxed font-display">
        {resource.whyILoveIt}
      </p>
      <cite class="mt-3 block text-sm text-muted-foreground not-italic">
        — Why I Love It
      </cite>
    </blockquote>
  {/if}

  {#if blocks.length > 0}
    <div class="prose max-w-none">
      <NotionBlocks {blocks} />
    </div>
  {/if}

  {#if resource.url}
    <div class="mt-12 pt-8 border-t border-border">
      <a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
          font-medium rounded-lg transition-all duration-200 hover:opacity-90"
      >
        Visit Resource
        <svg class="h-4 w-4 transition-transform duration-200 hover:translate-x-1" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  {/if}
</article>
