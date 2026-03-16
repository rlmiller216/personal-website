<script lang="ts">
	import type { ContentBlock } from '$lib/types/content';
	import { renderRichTextToSafeHtml } from './notion-render-utils';
	import NotionBlock from './NotionBlock.svelte';

	interface Props {
		block: ContentBlock;
	}

	let { block }: Props = $props();
</script>

{#if block.type === 'divider'}
	<hr class="border-current/10 my-6" />

{:else if block.type === 'table'}
	{#if block.rows && block.rows.length > 0}
		<div class="my-6 overflow-x-auto">
			<table class="w-full border-collapse">
				{#if block.hasHeader && block.rows.length > 0}
					<thead>
						<tr>
							{#each block.rows[0] as cell}
								<th class="border border-border px-3 py-2 bg-muted/30 text-left font-semibold">
									{@html renderRichTextToSafeHtml(cell)}
								</th>
							{/each}
						</tr>
					</thead>
				{/if}
				<tbody>
					{#each block.hasHeader ? block.rows.slice(1) : block.rows as row}
						<tr>
							{#each row as cell}
								<td class="border border-border px-3 py-2">
									{@html renderRichTextToSafeHtml(cell)}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}

{:else if block.type === 'column_list'}
	{#if block.columns && block.columns.length > 0}
		<div class="my-6 grid grid-cols-1 sm:grid-cols-{block.columns.length} gap-6">
			{#each block.columns as column}
				<div>
					{#each column as childBlock}
						<NotionBlock block={childBlock} />
					{/each}
				</div>
			{/each}
		</div>
	{/if}

{:else if block.type === 'synced_block'}
	{#each block.children as childBlock}
		<NotionBlock block={childBlock} />
	{/each}
{/if}
