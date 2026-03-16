<script lang="ts">
	import type { ContentBlock } from '$lib/types/content';
	import NotionTextBlock from './NotionTextBlock.svelte';
	import NotionMediaBlock from './NotionMediaBlock.svelte';
	import NotionLayoutBlock from './NotionLayoutBlock.svelte';

	interface Props {
		block: ContentBlock;
	}

	let { block }: Props = $props();

	const TEXT_TYPES = new Set([
		'paragraph', 'heading_1', 'heading_2', 'heading_3',
		'bulleted_list', 'numbered_list', 'bulleted_list_item', 'numbered_list_item',
		'to_do', 'toggle', 'quote', 'callout'
	]);
	const MEDIA_TYPES = new Set([
		'image', 'video', 'audio', 'code', 'embed', 'bookmark', 'file', 'equation'
	]);
	const LAYOUT_TYPES = new Set([
		'divider', 'table', 'column_list', 'synced_block'
	]);
</script>

{#if TEXT_TYPES.has(block.type)}
	<NotionTextBlock {block} />
{:else if MEDIA_TYPES.has(block.type)}
	<NotionMediaBlock {block} />
{:else if LAYOUT_TYPES.has(block.type)}
	<NotionLayoutBlock {block} />
{/if}
