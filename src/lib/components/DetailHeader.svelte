<script lang="ts">
  import type { Snippet } from 'svelte';

  let { backHref, backLabel, title, children }: {
    backHref: string;
    backLabel: string;
    title: string;
    children?: Snippet;
  } = $props();
</script>

<div class="relative -mt-16 pt-16 bg-hero">
  <div class="max-w-6xl mx-auto px-6 py-8 sm:py-10 animate-stagger">
    <!-- Back link — angular arrow, hover slide -->
    <a
      href={backHref}
      class="inline-flex items-center gap-2 text-sm text-hero-foreground/70
        hover:text-hero-foreground transition-all duration-200 mb-6
        hover:-translate-x-1"
    >
      <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter">
        <path d="M19 12H5M12 19l-7-7 7-7" />
      </svg>
      {backLabel}
    </a>

    <h1
      class="text-4xl sm:text-5xl lg:text-6xl font-bold text-hero-foreground tracking-tight leading-tight"
    >
      {title}
    </h1>

    {#if children}
      <div class="mt-4 flex flex-wrap items-center gap-3">
        {@render children()}
      </div>
    {/if}
  </div>
</div>
