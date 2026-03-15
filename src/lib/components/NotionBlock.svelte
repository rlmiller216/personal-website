<script lang="ts">
	import type { ContentBlock, RichTextSpan } from '$lib/types/content';
	import NotionBlock from './NotionBlock.svelte';

	interface Props {
		block: ContentBlock;
	}

	let { block }: Props = $props();

	/** Renders rich text spans with annotations as inline HTML. */
	function renderRichText(spans: RichTextSpan[]): string {
		return spans
			.map((span) => {
				let text = escapeHtml(span.text);

				if (span.annotations.code) text = `<code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">${text}</code>`;
				if (span.annotations.bold) text = `<strong>${text}</strong>`;
				if (span.annotations.italic) text = `<em>${text}</em>`;
				if (span.annotations.strikethrough) text = `<s>${text}</s>`;
				if (span.annotations.underline) text = `<u>${text}</u>`;
				if (span.href) text = `<a href="${escapeHtml(span.href)}" class="underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity" target="_blank" rel="noopener noreferrer">${text}</a>`;

				return text;
			})
			.join('');
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	function hasContent(spans: RichTextSpan[]): boolean {
		return spans.some((s) => s.text.trim().length > 0);
	}
</script>

{#if block.type === 'paragraph'}
	{#if hasContent(block.richText)}
		<p class="leading-relaxed">{@html renderRichText(block.richText)}</p>
	{:else}
		<div class="h-4"></div>
	{/if}

{:else if block.type === 'heading_1'}
	<h1 class="text-3xl font-bold mt-8 mb-4">{@html renderRichText(block.richText)}</h1>

{:else if block.type === 'heading_2'}
	<h2 class="text-2xl font-semibold mt-6 mb-3">{@html renderRichText(block.richText)}</h2>

{:else if block.type === 'heading_3'}
	<h3 class="text-xl font-semibold mt-4 mb-2">{@html renderRichText(block.richText)}</h3>

{:else if block.type === 'bulleted_list'}
	<ul class="list-disc pl-6 space-y-1">
		{#each block.children as item (item.id)}
			<li>
				{@html renderRichText(item.richText)}
				{#if item.children.length > 0}
					<NotionBlock block={{ ...item, type: 'bulleted_list', id: `nested-${item.id}` }} />
				{/if}
			</li>
		{/each}
	</ul>

{:else if block.type === 'numbered_list'}
	<ol class="list-decimal pl-6 space-y-1">
		{#each block.children as item (item.id)}
			<li>
				{@html renderRichText(item.richText)}
				{#if item.children.length > 0}
					<NotionBlock block={{ ...item, type: 'numbered_list', id: `nested-${item.id}` }} />
				{/if}
			</li>
		{/each}
	</ol>

{:else if block.type === 'to_do'}
	<div class="flex items-start gap-2">
		<input type="checkbox" checked={block.checked} disabled class="mt-1" />
		<span class={block.checked ? 'line-through opacity-60' : ''}>{@html renderRichText(block.richText)}</span>
	</div>

{:else if block.type === 'toggle'}
	<details class="group">
		<summary class="cursor-pointer font-medium hover:opacity-70 transition-opacity">
			{@html renderRichText(block.richText)}
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
	<blockquote class="border-l-4 border-current/20 pl-4 italic opacity-80">
		{@html renderRichText(block.richText)}
	</blockquote>

{:else if block.type === 'callout'}
	<div class="flex gap-3 p-4 rounded-lg bg-muted/50">
		{#if block.icon}
			<span class="text-xl flex-shrink-0">{block.icon}</span>
		{/if}
		<div>{@html renderRichText(block.richText)}</div>
	</div>

{:else if block.type === 'divider'}
	<hr class="border-current/10 my-6" />

{:else if block.type === 'image'}
	<figure class="my-6">
		<img
			src={block.url}
			alt={block.caption.map(s => s.text).join('') || 'Image'}
			class="rounded-lg max-w-full"
			loading="lazy"
		/>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<figcaption class="text-sm opacity-60 mt-2 text-center">
				{@html renderRichText(block.caption)}
			</figcaption>
		{/if}
	</figure>

{:else if block.type === 'code'}
	<div class="my-4">
		<pre class="bg-muted/50 rounded-lg p-4 overflow-x-auto"><code class="text-sm font-mono">{block.richText.map(s => s.text).join('')}</code></pre>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<p class="text-sm opacity-60 mt-1">{@html renderRichText(block.caption)}</p>
		{/if}
	</div>

{:else if block.type === 'bookmark'}
	<a
		href={block.url}
		class="block p-4 border rounded-lg hover:bg-muted/30 transition-colors"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="text-sm opacity-60">{block.url}</span>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<p class="mt-1">{@html renderRichText(block.caption)}</p>
		{/if}
	</a>

{:else if block.type === 'embed'}
	<div class="my-4">
		<iframe
			src={block.url}
			title="Embedded content"
			class="w-full rounded-lg border"
			style="min-height: 400px"
			loading="lazy"
		></iframe>
	</div>

{:else if block.type === 'video'}
	<figure class="my-6">
		<video controls class="rounded-lg max-w-full" preload="metadata">
			<source src={block.url} />
			<track kind="captions" />
		</video>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<figcaption class="text-sm opacity-60 mt-2 text-center">
				{@html renderRichText(block.caption)}
			</figcaption>
		{/if}
	</figure>
{/if}
