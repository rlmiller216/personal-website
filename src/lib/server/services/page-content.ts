// Convenience function: fetches Notion page blocks and transforms to ContentBlock[].
//
// Combines getPageBlocks() + transformBlocks() — the pattern used by
// about.service.ts and all 3 detail page routes.
//
// Called by: about.service.ts, detail route +page.server.ts files
// Depends on: notion.service.ts, notion-blocks.ts

import type { ContentBlock } from '$lib/types/content';
import { getPageBlocks } from './notion.service';
import { transformBlocks } from './notion-blocks';

export async function getPageContent(pageId: string): Promise<ContentBlock[]> {
	const rawBlocks = await getPageBlocks(pageId);
	return transformBlocks(rawBlocks);
}
