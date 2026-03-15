# Source Architecture

Map of everything under `src/`, how it connects, and where to find things.

---

## 1. High-Level Folder Tree

```
src/
├── app.css                               # Tailwind CSS 4 entry point (@import 'tailwindcss')
├── app.d.ts                              # SvelteKit type augmentations (App namespace)
├── app.html                              # HTML shell template (%sveltekit.head%, %sveltekit.body%)
│
├── lib/
│   ├── index.ts                          # Library barrel export (currently empty)
│   ├── utils.ts                          # shadcn-svelte utility: cn() for class merging
│   │
│   ├── assets/
│   │   └── favicon.svg                   # R monogram SVG favicon
│   │
│   ├── types/
│   │   └── content.ts                    # Domain interfaces: Project, Tool, Resource, ContentBlock
│   │
│   ├── components/
│   │   ├── NotionBlocks.svelte           # Iterates ContentBlock[] → renders each via NotionBlock
│   │   ├── NotionBlock.svelte            # Block type dispatcher — renders 17 block types as HTML
│   │   └── ui/                           # shadcn-svelte auto-generated components (empty until Chunk 3)
│   │
│   └── server/
│       └── services/
│           ├── notion.service.ts         # Notion API client, property extractors, generic fetcher
│           ├── notion-blocks.ts          # Block transformer: Notion API → ContentBlock[]
│           ├── projects.service.ts       # Project mapper + queries (getAllProjects, getFeaturedProjects)
│           ├── tools.service.ts          # Tool mapper + queries (getAllTools, getFeaturedTools)
│           ├── resources.service.ts      # Resource mapper + queries (getAllResources, groupByType)
│           ├── interests.service.ts      # Interest page fetcher (child pages → ContentBlock[])
│           └── about.service.ts          # About page fetcher (single page → ContentBlock[])
│
└── routes/
    ├── +layout.svelte                    # Root layout shell (nav + footer — placeholder)
    ├── +layout.ts                        # export const prerender = true (all routes static)
    └── +page.svelte                      # Home page (placeholder)
```

---

## 2. Module Responsibilities

### `lib/types/` — Domain Types (98 LOC, 1 file)

Pure TypeScript interfaces with zero dependencies. Defines the contract between services and components.

| Interface | Fields | Used By |
|---|---|---|
| `Project` | title, description, sector, status, role, imageUrl, url, featured, order | projects.service.ts, future ProjectCard.svelte |
| `Tool` | title, description, category, githubUrl, demoUrl, tags, featured | tools.service.ts, future ToolCard.svelte |
| `Resource` | title, description, type, category, author, url, whyILoveIt, imageUrl | resources.service.ts, future ResourceCard.svelte |
| `ContentBlock` | id, type, richText, children, url, caption, language, checked, icon | notion-blocks.ts, NotionBlock.svelte |
| `RichTextSpan` | text, annotations, href | ContentBlock.richText[], NotionBlock.svelte |
| `RichTextAnnotation` | bold, italic, strikethrough, underline, code, color | RichTextSpan.annotations |

### `lib/server/services/` — Notion Data Layer (724 LOC, 7 files)

Server-only modules that run at build time. Fetches data from the Notion API and transforms it into typed objects for Svelte routes.

#### `notion.service.ts` — Core Client (223 LOC)

The single source of truth for all Notion API interactions.

| Export | Signature | Purpose |
|---|---|---|
| `getTitle` | `(property) → string` | Extract title text from Notion page property |
| `getRichText` | `(property) → string` | Extract rich text as plain string |
| `getSelect` | `(property) → string` | Extract select option name |
| `getMultiSelect` | `(property) → string[]` | Extract multi-select option names |
| `getUrl` | `(property) → string` | Extract URL value |
| `getCheckbox` | `(property) → boolean` | Extract checkbox state |
| `getNumber` | `(property) → number` | Extract number value |
| `getFileUrl` | `(property) → string` | Extract first file/external URL |
| `queryAllPages` | `(dataSourceId, sorts?, filter?) → PageObjectResponse[]` | Paginated data source query |
| `fetchAndMap<T>` | `(dataSourceId, mapper, sorts?, filter?) → T[]` | Query + map in one call |
| `getPageBlocks` | `(pageId) → BlockObjectResponse[]` | Paginated block fetching |
| `getChildBlocks` | `(blockId) → BlockObjectResponse[]` | Alias for getPageBlocks (nested content) |
| `getChildPages` | `(parentId) → {id, title}[]` | Discover child pages under a parent |

**Key patterns:**
- Lazy client initialization via `getClient()` — only creates the `Client` when first needed
- Uses Notion SDK v5 API: `dataSources.query()` with `data_source_id` (not the removed `databases.query()`)
- All property extractors use the SDK's discriminated union type `PageProperty` — no `any`
- Error handling: try/catch with `[notion]` module prefix and descriptive messages
- Missing env var guard: returns empty array with console.warn

#### `notion-blocks.ts` — Block Transformer (236 LOC)

Transforms Notion API `BlockObjectResponse[]` into serializable `ContentBlock[]`.

| Export | Signature | Purpose |
|---|---|---|
| `transformBlocks` | `(blocks) → ContentBlock[]` | Main entry point — convert + group |

**Internal functions:**
- `extractRichText()` — Notion `RichTextItemResponse[]` → `RichTextSpan[]`
- `extractMediaUrl()` — file/external URL extraction from media blocks
- `blockToContentBlock()` — switch on 15 block types, returns null for unsupported
- `fetchAndTransformChildren()` — recursive child block resolution
- `groupListItems()` — wraps consecutive bulleted/numbered items in synthetic parent lists

**Supported block types:** paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, quote, callout, divider, image, code, bookmark, embed, video

#### Content Fetcher Services (215 LOC total, 5 files)

Thin mappers over `fetchAndMap<T>()`. Each owns one domain type.

| Service | LOC | Exports |
|---|---|---|
| `projects.service.ts` | 63 | `getAllProjects()`, `getFeaturedProjects()` |
| `tools.service.ts` | 53 | `getAllTools()`, `getFeaturedTools()` |
| `resources.service.ts` | 52 | `getAllResources()`, `groupByType()` |
| `interests.service.ts` | 67 | `getInterestSlugs()`, `getAllInterests()`, `getInterestBySlug()` |
| `about.service.ts` | 33 | `getAboutContent()` |

**Shared pattern (database services):**
```
mapX(page: PageObjectResponse): X {
  const props = page.properties;
  return { title: getTitle(props['Title']), ... };
}

export async function getAllX(): Promise<X[]> {
  if (!env.NOTION_X_DS_ID) { console.warn(...); return []; }
  return fetchAndMap(env.NOTION_X_DS_ID, mapX, sorts?, filter?);
}
```

**Page content services** (about, interests) use a different pattern — they fetch page blocks and transform them:
```
const rawBlocks = await getPageBlocks(pageId);
return transformBlocks(rawBlocks);
```

### `lib/components/` — Notion Renderers (193 LOC, 2 files)

Client-side Svelte components that render `ContentBlock[]` as styled HTML.

#### `NotionBlocks.svelte` (16 LOC)

Simple iterator. Takes `blocks: ContentBlock[]` prop, renders each via `<NotionBlock>`.

#### `NotionBlock.svelte` (177 LOC)

Block type dispatcher. Uses Svelte `{#if}` chain to render 17 block types with Tailwind classes.

**Key patterns:**
- `renderRichText()` converts `RichTextSpan[]` to inline HTML with annotation classes
- `escapeHtml()` prevents XSS in `{@html}` content
- Self-import (`import NotionBlock from './NotionBlock.svelte'`) for recursive rendering (Svelte 5 pattern — `<svelte:self>` is deprecated)
- Empty paragraphs render as `<div class="h-4">` spacers
- Images use `loading="lazy"` and caption support

### `routes/` — SvelteKit Pages (13 LOC, 3 files)

Currently minimal placeholders. Will expand in Chunks 3-4.

- `+layout.ts` (4 LOC) — `export const prerender = true` enables static generation for all routes
- `+layout.svelte` (7 LOC) — Root layout shell with `<slot />`
- `+page.svelte` (2 LOC) — Home page placeholder

---

## 3. Cross-Module Dependencies

```
                        ┌─────────────────┐
                        │  Notion API     │
                        │  (@notionhq/    │
                        │   client v5)    │
                        └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │ notion.service  │ ← Client init, property extractors,
                        │     (223 LOC)   │   queryAllPages, fetchAndMap, getPageBlocks
                        └──┬──────────┬───┘
                           │          │
              ┌────────────┘          └──────────────┐
              │                                      │
   ┌──────────▼──────────┐              ┌────────────▼────────────┐
   │  Database Services  │              │    notion-blocks.ts     │
   │  projects (63)      │              │      (236 LOC)          │
   │  tools (53)         │              │  transformBlocks()      │
   │  resources (52)     │              │  groupListItems()       │
   └──────────┬──────────┘              └────────────┬────────────┘
              │                                      │
              │                         ┌────────────┘
              │                         │
   ┌──────────▼──────────┐   ┌─────────▼───────────┐
   │  Page Services      │   │  Svelte Components  │
   │  about (33)         │   │  NotionBlocks (16)   │
   │  interests (67)     │   │  NotionBlock (177)   │
   └──────────┬──────────┘   └─────────┬───────────┘
              │                         │
              └────────┬────────────────┘
                       │
              ┌────────▼────────┐
              │  content.ts     │  ← Shared types: Project, Tool, Resource,
              │    (98 LOC)     │    ContentBlock, RichTextSpan
              └─────────────────┘
```

**Dependency rules:**
- `content.ts` has zero dependencies (pure types)
- `notion.service.ts` depends only on `@notionhq/client` and `$env`
- `notion-blocks.ts` depends on `notion.service.ts` (for child block fetching) and `content.ts`
- Database services depend on `notion.service.ts` and `content.ts`
- Page services depend on `notion.service.ts`, `notion-blocks.ts`, and `content.ts`
- Components depend only on `content.ts` (receive typed data, never call services)
- Routes (future) will depend on services and components

---

## 4. LOC Summary

| Module | LOC | % of Total | Files |
|---|---|---|---|
| Notion block transformer | 236 | 16% | 1 |
| Notion client + fetcher | 223 | 15% | 1 |
| NotionBlock component | 177 | 12% | 1 |
| Content types | 98 | 7% | 1 |
| Content fetcher services | 268 | 18% | 5 |
| Routes (placeholders) | 13 | 1% | 3 |
| Utilities + config | 27 | 2% | 3 |
| **Tests** | **446** | **30%** | **2** |
| **Total** | **~1,488** | **100%** | **17** |

> Tests are 30% of total LOC — healthy ratio for a project with thorough service-layer testing.
