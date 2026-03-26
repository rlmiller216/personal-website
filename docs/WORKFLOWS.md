# Workflows & Data Flows

Every state machine, data pipeline, and content workflow in the personal website codebase.

---

## 1. Content Authoring Workflow

The primary workflow. Rebecca edits content in Notion; the website rebuilds to reflect changes.

```
  Rebecca                    Notion                    GitHub/Netlify
  ───────                    ──────                    ──────────────

  Edits a project    ──▶   Database updated     ──▶   (no immediate effect)
  in Notion UI              (Properties saved)

                                                       Git push triggers build
                                                       OR manual "Trigger deploy"
                                                              │
                                                              ▼
                                                       npm run build
                                                              │
                                                              ▼
                                                       SvelteKit fetches from
                                                       Notion API at build time
                                                              │
                                                              ▼
                                                       Static HTML deployed
                                                       to Netlify CDN
                                                              │
                                                              ▼
                                                       Visitors see updated
                                                       content
```

### Content Types and Where to Edit

| Content | Where Rebecca Edits | What Happens at Build |
|---|---|---|
| Projects | Projects database → add/edit rows | `projects.service.ts` fetches and maps |
| Open Source tools | Open Source database → add/edit rows | `tools.service.ts` fetches and maps |
| Resources | Resources database → add/edit rows | `resources.service.ts` fetches and maps |
| About page | About page → edit blocks | `about.service.ts` fetches blocks → transforms |
| Image width | Add `[w:50]` to start of any image caption | `parseImageWidth()` strips hint, sets `imageWidth` on block; image renders at that % width, centered |

### Latency

| Trigger | Time to Live |
|---|---|
| Git push | ~1-2 minutes (Netlify build + deploy) |
| Manual "Trigger deploy" | ~1-2 minutes |

> **Note:** No scheduled build hooks. Netlify free tier allows ~20 deploys/month (300 credits). See SYSTEM_ARCHITECTURE.md §5.6.

---

## 2. Build Pipeline

### 2.1 Build State Machine

```
┌──────────┐     ┌───────────┐     ┌──────────────┐     ┌──────────┐     ┌────────────┐
│  Idle    │────▶│  Install  │────▶│  Build       │────▶│  Output  │────▶│  Deploy    │
│          │     │  (npm ci) │     │  (vite build)│     │  (build/)│     │  (Netlify) │
└──────────┘     └───────────┘     └──────┬───────┘     └──────────┘     └────────────┘
                                          │
                              ┌───────────┼───────────┐
                              │           │           │
                        ┌─────▼──┐  ┌─────▼──┐  ┌────▼────┐
                        │ Fetch  │  │ Trans- │  │ Render  │
                        │ from   │  │ form   │  │ to HTML │
                        │ Notion │  │ data   │  │         │
                        └────────┘  └────────┘  └─────────┘
```

### 2.2 What Happens During Build

1. **SvelteKit prerendering** visits each route and calls its `+page.server.ts` `load()` function
2. **load() calls services** which call the Notion API:
   - Database routes → `fetchAndMap()` → typed arrays
   - Page routes → `getPageBlocks()` → `transformBlocks()` → `ContentBlock[]`
3. **Page components** receive data as props and render to HTML
4. **adapter-static** writes all rendered HTML to `build/`
5. **Netlify** deploys `build/` to its CDN

### 2.3 Build Failure Modes

| Failure | Behavior | User Impact |
|---|---|---|
| `NOTION_API_KEY` missing | All services return `[]`, pages render empty | Site deploys with no content |
| Specific `_DS_ID` missing | That service returns `[]` with console.warn | Affected section is empty |
| Notion API unreachable | Services catch error, return `[]`, log `[notion] failed...` | Site deploys with stale/no content |
| Notion rate limit hit | API returns 429, caught by error handler | Partial content, retry on next build |
| TypeScript errors | `svelte-check` fails, build aborts | Previous deploy stays live |

---

## 3. Database Fetch Pipeline

For Projects, Tools, and Resources — fetching structured data from Notion databases.

```
┌─────────────────┐
│ Environment Var  │   NOTION_PROJECTS_DS_ID
│ Check            │   (return [] if missing)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ queryAllPages() │   notion.dataSources.query({ data_source_id, sorts, filter })
│                 │   Loops with start_cursor until has_more === false
│                 │   Collects PageObjectResponse[]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ mapper()        │   mapProject(page) / mapTool(page) / mapResource(page)
│                 │   Extracts properties via getTitle(), getRichText(), getSelect(), etc.
│                 │   Returns typed object: Project / Tool / Resource
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return T[]      │   Typed array passed to +page.server.ts load() function
└─────────────────┘
```

### Property Extraction Detail

Each Notion property type has a dedicated extractor that type-checks before accessing:

| Extractor | Notion Type | Returns | On Wrong Type |
|---|---|---|---|
| `getTitle()` | `title` | Joined plain_text string | `""` |
| `getRichText()` | `rich_text` | Joined plain_text string | `""` |
| `getSelect()` | `select` | Option name | `""` |
| `getMultiSelect()` | `multi_select` | Array of names | `[]` |
| `getUrl()` | `url` | URL string | `""` |
| `getCheckbox()` | `checkbox` | Boolean | `false` |
| `getNumber()` | `number` | Number | `0` |
| `getFileUrl()` | `files` | First file URL | `""` |

> **Gotcha:** The `sorts` parameter in `dataSources.query()` must be an **array** of sort objects (e.g., `[{ property: 'Order', direction: 'ascending' }]`). A single object will fail with a validation error that cascades to prerender failures for dynamic routes.

---

## 4. Block Rendering Pipeline

For About page — transforming Notion page blocks into rendered HTML.

### 4.1 Full Pipeline

```
┌──────────────────┐
│ getPageBlocks()  │   notion.blocks.children.list({ block_id: pageId })
│                  │   Loops with start_cursor until has_more === false
│                  │   Returns BlockObjectResponse[]
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ transformBlocks()│   For each block:
│                  │     blockToContentBlock(block)
│                  │       → switch on block.type (22+ types)
│                  │       → extractRichText() for text content
│                  │       → extractMediaUrl() for images/video/audio
│                  │       → parseImageWidth() strips [w:N] from image captions
│                  │       → getEmbedConfig() for embed provider detection
│                  │       → highlightCode() for Shiki syntax highlighting
│                  │       → custom child-fetch for tables (table_row cells)
│                  │       → recursive fetchAndTransformChildren() if has_children
│                  │     Returns ContentBlock or null (unsupported type)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ groupListItems() │   Scans ContentBlock[] for consecutive list items
│                  │   Wraps bulleted_list_item runs in { type: 'bulleted_list' }
│                  │   Wraps numbered_list_item runs in { type: 'numbered_list' }
│                  │   Non-list blocks break the grouping
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ ContentBlock[]   │   Serializable, JSON-safe, no SDK references
│ (to page data)   │   Passed to Svelte components via page load
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ <NotionBlocks>   │   Iterates blocks, renders each via <NotionBlock>
│ <NotionBlock>    │   Dispatcher → routes to sub-components:
│                  │     NotionTextBlock: paragraphs, headings, lists, toggles
│                  │     NotionMediaBlock: images, code (Shiki), embeds, audio, files, PDFs
│                  │     NotionLayoutBlock: tables, column grids, synced blocks
│                  │   renderRichTextToSafeHtml() → XSS-safe HTML with annotations
│                  │   Recursive for nested children (toggle, nested lists)
└──────────────────┘
```

### 4.2 Block Type Support Matrix

| Notion Block Type | ContentBlock Type | HTML Output | Recursive? | Notes |
|---|---|---|---|---|
| `paragraph` | `paragraph` | `<p>` | No | Empty → spacer div |
| `heading_1` | `heading_1` | `<h1>` | No | |
| `heading_2` | `heading_2` | `<h2>` | No | |
| `heading_3` | `heading_3` | `<h3>` | No | |
| `bulleted_list_item` | → grouped into `bulleted_list` | `<ul><li>` | Yes (nested lists) | |
| `numbered_list_item` | → grouped into `numbered_list` | `<ol><li>` | Yes (nested lists) | |
| `to_do` | `to_do` | `<div>` with checkbox | No | |
| `toggle` | `toggle` | `<details><summary>` | Yes (children) | |
| `quote` | `quote` | `<blockquote>` | No | |
| `callout` | `callout` | `<div>` with icon + text | No | |
| `divider` | `divider` | `<hr>` | No | |
| `image` | `image` | `<figure><img>` + `<figcaption>` | No | lazy loading; `[w:N]` caption prefix sets width % (1–100), centered |
| `code` | `code` | `<pre><code>` or Shiki HTML | No | Shiki dual-theme, plaintext fallback |
| `bookmark` | `bookmark` | `<a>` card | No | |
| `embed` | `embed` | `<iframe>` with aspect-ratio | No | Smart provider detection (YouTube, Miro, etc.) |
| `video` | `video` or → `embed` | `<video>` or `<iframe>` | No | YouTube/Vimeo → embed type |
| `table` | `table` | `<table>` with optional `<thead>` | No* | Custom child-fetch for table_row cells |
| `audio` | `audio` | `<audio controls>` | No | |
| `file` | `file` | Download link | No | S3 URLs cached via `downloadNotionFile()` |
| `pdf` | `pdf` | `<object>` PDF viewer + fallback link | No | S3 URLs cached via `downloadNotionFile()` |
| `column_list` | `column_list` | Responsive grid | Yes (columns) | Sequential child fetching |
| `synced_block` | `synced_block` | Transparent wrapper | Yes (children) | Resolves synced_from source |
| `equation` | `equation` | Monospace/italic `<div>` | No | No KaTeX (styled fallback) |
| *(all others)* | *(skipped)* | *(nothing)* | No | |

### 4.3 List Grouping Detail

Notion's API returns individual `bulleted_list_item` blocks without a parent `<ul>`. The `groupListItems()` function creates synthetic parent blocks:

```
Input (from Notion API):
  [bulleted_list_item("A"), bulleted_list_item("B"), paragraph("text"), bulleted_list_item("C")]

After groupListItems():
  [bulleted_list(children: [A, B]), paragraph("text"), bulleted_list(children: [C])]
```

**Rules:**
- Consecutive items of the same type are grouped under one parent
- Different list types break the group: `bulleted → numbered` = two separate lists
- Non-list blocks break the group: `bulleted → paragraph → bulleted` = two separate lists

### 4.4 Rich Text Rendering

Notion rich text carries annotations (bold, italic, code, etc.) per span. The `renderRichTextToSafeHtml()` function in `notion-render-utils.ts` converts these to inline HTML:

```
RichTextSpan { text: "hello", annotations: { bold: true, code: true }, href: null }
  → <strong><code class="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">hello</code></strong>
```

**Annotation priority** (innermost to outermost): code → bold → italic → strikethrough → underline → link

**Security:** `escapeHtml()` runs on all text content before wrapping in annotation tags, preventing XSS via `{@html}`.

---

## 5. Error Handling Flow

### 5.1 Error Handling Strategy

All errors are caught at the service level. No errors propagate to routes — services return empty results on failure.

```
Notion API call
    │
    ├── Success → process and return data
    │
    └── Error → catch block
                   │
                   ├── Extract message: error instanceof Error ? error.message : String(error)
                   │
                   ├── Log with module prefix: console.error(`[module] failed to X — ${message}`)
                   │
                   └── Return safe default: [] or empty typed array
```

### 5.2 Module Log Prefixes

Every service logs with a consistent prefix for traceability:

| Module | Prefix | Example |
|---|---|---|
| notion.service.ts | `[notion]` | `[notion] queried ab98f5b1: 5 pages` |
| projects.service.ts | `[projects]` | `[projects] env.NOTION_PROJECTS_DS_ID not set` |
| tools.service.ts | `[tools]` | `[tools] env.NOTION_TOOLS_DS_ID not set` |
| resources.service.ts | `[resources]` | `[resources] env.NOTION_RESOURCES_DS_ID not set` |
| about.service.ts | `[about]` | `[about] failed to load about content — 401 Unauthorized` |

### 5.3 Graceful Degradation

The site always builds, even with partial or no Notion data:

| Scenario | Behavior |
|---|---|
| No API key | All services disabled, all sections empty |
| One database ID missing | That section empty, others work |
| Notion API down | All sections empty (previous deploy stays live on Netlify) |
| Unsupported block type in page | Block silently skipped, rest of page renders |
| Empty database | Section renders (future: empty state message) |

---

## 6. Design Token Flow

Design tokens flow from palette definition to rendered utility classes:

```
Palette hex → OKLCH conversion → CSS custom properties (:root in app.css)
  → Tailwind @theme inline mapping → utility classes (bg-primary, text-secondary, etc.)
```

Each color is defined once as an OKLCH value in `:root`. Tailwind's `@theme` block references these custom properties, generating utility classes. Components use only Tailwind utilities — never raw hex or OKLCH values.

## 7. Dark Mode Workflow

```
Page load → inline <script> in app.html (runs before paint)
  → checks localStorage for saved preference
  → falls back to prefers-color-scheme media query
  → sets .dark class on <html> synchronously (no flash)
  → CSS custom properties switch via .dark {} block in app.css
  → all components automatically reflect the active mode
```

The inline script runs before any rendering, so users never see a light-mode flash on dark-mode pages. Toggling the mode updates `localStorage` and flips the `.dark` class; no page reload is needed.
