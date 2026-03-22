<script lang="ts">
	import type { ContentBlock } from '$lib/types/content';
	import { renderRichTextToSafeHtml, hasContent } from './notion-render-utils';
	// Circular import: text blocks render nested children via the dispatcher.
	// Svelte 5 handles this via lazy resolution.
	import NotionBlock from './NotionBlock.svelte';

	interface Props {
		block: ContentBlock;
	}

	let { block }: Props = $props();
</script>

{#if block.type === 'paragraph'}
	{#if hasContent(block.richText)}
		<p class="font-normal md:font-medium leading-relaxed">{@html renderRichTextToSafeHtml(block.richText)}</p>
	{:else}
		<div class="h-4"></div>
	{/if}

{:else if block.type === 'heading_1'}
	{#if block.isToggleable}
		<details class="mt-8 mb-4 group">
			<summary class="cursor-pointer text-3xl font-bold font-display
				list-none [&::-webkit-details-marker]:hidden
				hover:opacity-70 transition-opacity">
				<span class="flex items-center gap-2">
					<svg class="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 3l5 5-5 5"/></svg>
					<span>{@html renderRichTextToSafeHtml(block.richText)}</span>
				</span>
			</summary>
			{#if block.children.length > 0}
				<div class="pl-7 mt-2 space-y-2">
					{#each block.children as child (child.id)}
						<NotionBlock block={child} />
					{/each}
				</div>
			{/if}
		</details>
	{:else}
		<h1 class="text-3xl font-bold mt-8 mb-4">{@html renderRichTextToSafeHtml(block.richText)}</h1>
	{/if}

{:else if block.type === 'heading_2'}
	{#if block.isToggleable}
		<details class="mt-6 mb-3 group">
			<summary class="cursor-pointer text-2xl font-semibold font-display
				list-none [&::-webkit-details-marker]:hidden
				hover:opacity-70 transition-opacity">
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 3l5 5-5 5"/></svg>
					<span>{@html renderRichTextToSafeHtml(block.richText)}</span>
				</span>
			</summary>
			{#if block.children.length > 0}
				<div class="pl-6 mt-2 space-y-2">
					{#each block.children as child (child.id)}
						<NotionBlock block={child} />
					{/each}
				</div>
			{/if}
		</details>
	{:else}
		<h2 class="text-2xl font-semibold mt-6 mb-3">{@html renderRichTextToSafeHtml(block.richText)}</h2>
	{/if}

{:else if block.type === 'heading_3'}
	{#if block.isToggleable}
		<details class="mt-4 mb-2 group">
			<summary class="cursor-pointer text-xl font-semibold font-display
				list-none [&::-webkit-details-marker]:hidden
				hover:opacity-70 transition-opacity">
				<span class="flex items-center gap-2">
					<svg class="w-4 h-4 flex-shrink-0 transition-transform group-open:rotate-90" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"><path d="M6 3l5 5-5 5"/></svg>
					<span>{@html renderRichTextToSafeHtml(block.richText)}</span>
				</span>
			</summary>
			{#if block.children.length > 0}
				<div class="pl-6 mt-2 space-y-2">
					{#each block.children as child (child.id)}
						<NotionBlock block={child} />
					{/each}
				</div>
			{/if}
		</details>
	{:else}
		<h3 class="text-xl font-semibold mt-4 mb-2">{@html renderRichTextToSafeHtml(block.richText)}</h3>
	{/if}

{:else if block.type === 'bulleted_list'}
	<ul class="list-disc pl-6 space-y-1 font-normal">
		{#each block.children as item (item.id)}
			<li>
				{@html renderRichTextToSafeHtml(item.richText)}
				{#if item.children.length > 0}
					<NotionBlock block={{ ...item, type: 'bulleted_list', id: `nested-${item.id}` }} />
				{/if}
			</li>
		{/each}
	</ul>

{:else if block.type === 'numbered_list'}
	<ol class="list-decimal pl-6 space-y-1 font-normal">
		{#each block.children as item (item.id)}
			<li>
				{@html renderRichTextToSafeHtml(item.richText)}
				{#if item.children.length > 0}
					<NotionBlock block={{ ...item, type: 'numbered_list', id: `nested-${item.id}` }} />
				{/if}
			</li>
		{/each}
	</ol>

{:else if block.type === 'to_do'}
	<div class="flex items-start gap-2">
		<input type="checkbox" checked={block.checked} disabled class="mt-1" />
		<span class={block.checked ? 'line-through opacity-60' : ''}>{@html renderRichTextToSafeHtml(block.richText)}</span>
	</div>

{:else if block.type === 'toggle'}
	<details class="group">
		<summary class="cursor-pointer font-medium hover:opacity-70 transition-opacity">
			{@html renderRichTextToSafeHtml(block.richText)}
		</summary>
		{#if block.children.length > 0}
			<div class="pl-4 mt-2 space-y-2">
				{#each block.children as child (child.id)}
					<NotionBlock block={child} />
				{/each}
			</div>
		{/if}
	</details>

{:else if block.type === 'quote'}
	<blockquote class="border-l-4 border-primary pl-4 italic bg-primary/5 py-2 rounded-r-lg">
		{@html renderRichTextToSafeHtml(block.richText)}
	</blockquote>

{:else if block.type === 'callout'}
	<div class="flex gap-3 p-4 rounded-lg bg-secondary/20">
		{#if block.icon}
			<span class="text-xl flex-shrink-0">{block.icon}</span>
		{/if}
		<div>{@html renderRichTextToSafeHtml(block.richText)}</div>
	</div>
{/if}
