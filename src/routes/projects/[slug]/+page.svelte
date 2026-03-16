<script lang="ts">
  import DetailHeader from '$lib/components/DetailHeader.svelte';
  import NotionBlocks from '$lib/components/NotionBlocks.svelte';

  let { data } = $props();
  const project = $derived(data.project);
  const blocks = $derived(data.blocks);
</script>

<svelte:head>
  <title>{project.title} — {data.siteName}</title>
  {#if project.description}
    <meta name="description" content={project.description} />
  {/if}
  <meta property="og:title" content="{project.title} — {data.siteName}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="https://rlmiller.netlify.app/projects/{project.slug}" />
  {#if project.description}
    <meta property="og:description" content={project.description} />
  {/if}
  {#if project.imageUrl}
    <meta property="og:image" content={project.imageUrl} />
  {/if}
</svelte:head>

<DetailHeader backHref="/projects" backLabel="All Projects" title={project.title}>
  {#if project.sector}
    <span class="rounded-full px-3 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground">
      {project.sector}
    </span>
  {/if}
  {#if project.status}
    <span class="rounded-full px-3 py-0.5 text-xs font-medium bg-hero-foreground/10 text-hero-foreground/80">
      {project.status}
    </span>
  {/if}
  {#if project.role}
    <span class="text-sm text-hero-foreground/60">
      Role: {project.role}
    </span>
  {/if}
</DetailHeader>

<article class="max-w-3xl mx-auto px-6 py-12 animate-stagger">
  {#if project.imageUrl}
    <img
      src={project.imageUrl}
      alt={project.title}
      class="w-full max-h-96 object-cover rounded-lg mb-8 transition-transform duration-300 hover:scale-[1.02]"
    />
  {/if}

  {#if project.description}
    <p class="text-lg text-muted-foreground leading-relaxed mb-8">
      {project.description}
    </p>
  {/if}

  {#if blocks.length > 0}
    <div class="prose max-w-none">
      <NotionBlocks {blocks} />
    </div>
  {/if}

  {#if project.url}
    <div class="mt-12 pt-8 border-t border-border">
      <a
        href={project.url}
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground
          font-medium rounded-lg transition-all duration-200 hover:opacity-90"
      >
        Visit Project
        <svg class="h-4 w-4 transition-transform duration-200 hover:translate-x-1" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </a>
    </div>
  {/if}
</article>
