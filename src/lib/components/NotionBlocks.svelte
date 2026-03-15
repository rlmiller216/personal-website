<script lang="ts">
	import type { ContentBlock } from '$lib/types/content';
	import NotionBlock from './NotionBlock.svelte';

	interface Props {
		blocks: ContentBlock[];
	}

	let { blocks }: Props = $props();
</script>

<div class="notion-content space-y-4">
	{#each blocks as block (block.id)}
		<NotionBlock {block} />
	{/each}
</div>
