<script lang="ts">
	import type { ContentBlock } from '$lib/types/content';
	import { renderRichTextToSafeHtml, hasContent } from './notion-render-utils';

	interface Props {
		block: ContentBlock;
	}

	let { block }: Props = $props();
</script>

{#if block.type === 'image'}
	<figure class="my-6">
		<img
			src={block.url}
			alt={block.caption.map(s => s.text).join('') || 'Image'}
			class="rounded-lg max-w-full shadow-sm border border-border"
			loading="lazy"
		/>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<figcaption class="text-sm opacity-60 mt-2 text-center">
				{@html renderRichTextToSafeHtml(block.caption)}
			</figcaption>
		{/if}
	</figure>

{:else if block.type === 'video'}
	<figure class="my-6">
		<video controls class="rounded-lg max-w-full" preload="metadata">
			<source src={block.url} />
			<track kind="captions" />
		</video>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<figcaption class="text-sm opacity-60 mt-2 text-center">
				{@html renderRichTextToSafeHtml(block.caption)}
			</figcaption>
		{/if}
	</figure>

{:else if block.type === 'code'}
	<div class="my-4">
		{#if block.highlightedHtml}
			<div class="[&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:text-sm">
				{@html block.highlightedHtml}
			</div>
		{:else}
			<pre class="bg-hero text-hero-foreground rounded-lg p-4 overflow-x-auto"><code class="text-sm font-mono">{block.richText.map(s => s.text).join('')}</code></pre>
		{/if}
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<p class="text-sm opacity-60 mt-1">{@html renderRichTextToSafeHtml(block.caption)}</p>
		{/if}
	</div>

{:else if block.type === 'embed'}
	<div class="my-4">
		<iframe
			src={block.url}
			title="Embedded content"
			class="w-full rounded-lg border {block.embedType ? `embed-${block.embedType}` : ''}"
			style="aspect-ratio: {block.embedAspectRatio || '16/9'}; min-height: min({block.embedMinHeight || '315px'}, 70vh)"
			loading="lazy"
			allowfullscreen
		></iframe>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<p class="text-sm opacity-60 mt-2 text-center">{@html renderRichTextToSafeHtml(block.caption)}</p>
		{/if}
	</div>

{:else if block.type === 'audio'}
	<figure class="my-6">
		<audio controls class="w-full" preload="metadata">
			<source src={block.url} />
		</audio>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<figcaption class="text-sm opacity-60 mt-2 text-center">
				{@html renderRichTextToSafeHtml(block.caption)}
			</figcaption>
		{/if}
	</figure>

{:else if block.type === 'pdf'}
	{#if block.fileUrl}
		<figure class="my-6">
			<object
				data={block.fileUrl}
				type="application/pdf"
				class="w-full rounded-lg border border-border"
				style="height: min(80vh, 800px)"
				title={block.fileName || 'PDF document'}
			>
				<!-- Fallback for browsers that can't embed PDFs -->
				<div class="p-6 text-center">
					<p class="text-muted-foreground mb-3">PDF preview not available in this browser.</p>
					<a
						href={block.fileUrl}
						class="inline-flex items-center gap-2 text-primary underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity"
						target="_blank"
						rel="noopener noreferrer"
					>Open PDF: {block.fileName || 'Document.pdf'}</a>
				</div>
			</object>
			{#if block.caption.length > 0 && hasContent(block.caption)}
				<figcaption class="text-sm opacity-60 mt-2 text-center">
					{@html renderRichTextToSafeHtml(block.caption)}
				</figcaption>
			{/if}
		</figure>
	{/if}

{:else if block.type === 'file'}
	{#if block.fileUrl}
		<div class="my-4 p-4 border rounded-lg flex items-center gap-3">
			<span class="text-xl">📎</span>
			<a
				href={block.fileUrl}
				class="text-primary underline decoration-1 underline-offset-2 hover:opacity-70 transition-opacity"
				target="_blank"
				rel="noopener noreferrer"
				download
			>{block.fileName || 'Download file'}</a>
		</div>
	{/if}

{:else if block.type === 'equation'}
	{#if block.expression}
		<div class="my-4 px-4 py-3 bg-muted/30 rounded-lg overflow-x-auto">
			<span class="font-mono italic text-sm">{block.expression}</span>
		</div>
	{/if}

{:else if block.type === 'bookmark'}
	<a
		href={block.url}
		class="block p-4 border rounded-lg hover:bg-muted/30 transition-colors"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="text-sm opacity-60">{block.url}</span>
		{#if block.caption.length > 0 && hasContent(block.caption)}
			<p class="mt-1">{@html renderRichTextToSafeHtml(block.caption)}</p>
		{/if}
	</a>
{/if}
