# Source Architecture

Map of everything under `src/`, how it connects, and where to find things.

---

## 1. High-Level Folder Tree

```
src/
├── app.css                               # Design system: color tokens (hex + OKLCH), typography, animations (~240 LOC)
├── app.d.ts                              # SvelteKit type augmentations (App namespace)
├── app.html                              # HTML shell + Google Fonts preconnect + dark-mode flash prevention (~20 LOC)
│
├── lib/
│   ├── index.ts                          # Library barrel export (currently empty)
│   ├── utils.ts                          # shadcn-svelte utility: cn() for class merging
│   │
│   ├── assets/
│   │   └── favicon.svg                   # R monogram SVG favicon
│   │
│   ├── types/
│   │   └── content.ts                    # Domain interfaces: Project, Tool, Resource, ContentBlock + isVideoUrl() helper
│   │
│   ├── components/
│   │   ├── ProjectCard.svelte            # Project card: hover translate-up, Ultra Violet overlay (~45 LOC)
│   │   ├── ToolCard.svelte               # Tool card: image-forward, category badge, hover shadow (~40 LOC, used on /open-source)
│   │   ├── ToolListItem.svelte           # Tool image card: Ultra Violet left border, hover arrow (~45 LOC, homepage)
│   │   ├── ResourceCard.svelte           # Resource card: Neon Chartreuse bottom border, hover arrow (~45 LOC)
│   │   ├── CardMedia.svelte              # Shared card media — renders <video> or <img> with poster + reduced-motion pause
│   │   ├── StickySection.svelte          # Sticky section header: linked title + angular arrow (~54 LOC)
│   │   ├── ThemeToggle.svelte            # Dark mode toggle: Sun/Moon icons, localStorage, class prop (~29 LOC)
│   │   ├── LetterSidebar.svelte          # Floating RLM sidebar (RAF-driven scroll physics) + hamburger toggle (~170 LOC)
│   │   ├── DetailHeader.svelte           # Shared detail page header: back link, title, badge slot (~40 LOC)
│   │   ├── NotionBlocks.svelte           # Iterates ContentBlock[] → renders each via NotionBlock
│   │   ├── NotionBlock.svelte            # Block type dispatcher → routes to sub-components (~33 LOC)
│   │   ├── NotionTextBlock.svelte        # Text blocks: paragraphs, headings, lists, toggles, quotes, callouts (~87 LOC)
│   │   ├── NotionMediaBlock.svelte       # Media blocks: images, video, audio, code, embeds, bookmarks, files, PDFs, equations (~130 LOC)
│   │   ├── NotionLayoutBlock.svelte      # Layout blocks: dividers, tables, column layouts, synced blocks (~63 LOC)
│   │   ├── notion-render-utils.ts        # renderRichTextToSafeHtml(), escapeHtml(), hasContent() (~46 LOC)
│   │   └── ui/                           # shadcn-svelte auto-generated components
│   │
│   └── server/
│       └── services/
│           ├── notion.service.ts         # Notion API client, property extractors (incl. getMediaFiles), generic fetcher, createCachedFetcher, warnSlugCollisions (~263 LOC)
│           ├── page-content.ts           # getPageContent() — combines getPageBlocks() + transformBlocks()
│           ├── notion-blocks.ts          # Block transformer: Notion API → ContentBlock[] (22+ types, ~230 LOC)
│           ├── notion-block-utils.ts     # Shared helpers: extractRichText, extractMediaUrl, groupListItems (~85 LOC)
│           ├── embed-config.ts           # URL pattern → embed provider/aspect-ratio detection (~53 LOC)
│           ├── code-highlight.ts         # Shiki syntax highlighting: promise-cached, dual-theme (~82 LOC)
│           ├── image-cache.ts           # Build-time Notion file downloader: images + videos → static/images/, PDFs/files → static/files/, HEIC→JPEG conversion, dedup, hash. downloadItemMedia (renamed from downloadItemImages) (~148 LOC)
│           ├── projects.service.ts       # Project mapper + queries (uses createCachedFetcher)
│           ├── tools.service.ts          # Tool mapper + queries (uses createCachedFetcher)
│           ├── resources.service.ts      # Resource mapper + queries (uses createCachedFetcher, groupByType)
│           └── about.service.ts          # About page fetcher (uses getPageContent)
│
└── routes/
    ├── +layout.svelte                    # Root layout: LetterSidebar + slide-out overlay, non-fixed nav, ThemeToggle, Deep Twilight footer w/ land acknowledgement (~206 LOC)
    ├── +layout.server.ts                 # Loads site metadata from RM_* env vars
    ├── +layout.ts                        # export const prerender = true (all routes static)
    ├── +page.svelte                      # Home: Deep Twilight hero with 3-part headline, feature card + grid, stagger animations (~145 LOC)
    ├── +page.server.ts                   # Fetches featured items from all Notion databases
    ├── +error.svelte                     # Branded error page (404/500)
    ├── about/
    │   ├── +page.svelte                  # Renders Notion blocks via NotionBlocks component
    │   └── +page.server.ts               # Fetches about page content
    ├── projects/
    │   ├── +page.svelte                  # Project card grid
    │   └── +page.server.ts               # Fetches all non-archived projects
    ├── open-source/
    │   ├── +page.svelte                  # Tool card grid
    │   └── +page.server.ts               # Fetches all tools
    ├── resources/
    │   ├── +page.svelte                  # Resources grouped by type
    │   └── +page.server.ts               # Fetches + groups resources
    └── contact/
        └── +page.svelte                  # Formspree contact form (name/email/message)
```

---

## 2. Module Responsibilities

### `lib/types/` — Domain Types (~149 LOC, 1 file)

Pure TypeScript interfaces with zero dependencies. Defines the contract between services and components.

| Interface | Fields | Used By |
|---|---|---|
| `Project` | title, description, sector (string[]), status, role, imageUrl, url, featured, order, tags | projects.service.ts, ProjectCard.svelte |
| `Tool` | title, description, category, githubUrl, demoUrl, tags, featured, imageUrl, order | tools.service.ts, ToolCard.svelte, ToolListItem.svelte |
| `Resource` | title, description, type, category, author, url, whyILoveIt, imageUrl | resources.service.ts, ResourceCard.svelte |
| `ContentBlock` | id, type, richText, children, url, caption, language, checked, icon | notion-blocks.ts, NotionBlock.svelte |
| `RichTextSpan` | text, annotations, href | ContentBlock.richText[], NotionBlock.svelte |
| `RichTextAnnotation` | bold, italic, strikethrough, underline, code, color | RichTextSpan.annotations |

### `lib/server/services/` — Notion Data Layer (~870 LOC, 9 files)

Server-only modules that run at build time. Fetches data from the Notion API and transforms it into typed objects for Svelte routes.

#### `notion.service.ts` — Core Client (~263 LOC)

The single source of truth for all Notion API interactions.

| Export | Signature | Purpose |
|---|---|---|
| `getTitle` | `(property) → string` | Extract title text from Notion page property |
| `getRichText` | `(property) → string` | Extract rich text as plain string |
| `getSelect` | `(property) → string` | Extract select option name |
| `getMultiSelect` | `(property) → string[]` | Extract multi-select option names |
| `getSelectOrMulti` | `(property) → string[]` | Extract from select or multi_select as string[] |
| `getUrl` | `(property) → string` | Extract URL value |
| `getCheckbox` | `(property) → boolean` | Extract checkbox state |
| `getNumber` | `(property) → number` | Extract number value |
| `getFileUrl` | `(property) → string` | Extract first file/external URL |
| `getMediaFiles` | `(property) → {url, name}[]` | Extract all file URLs from files property (images + videos) |
| `queryAllPages` | `(dataSourceId, sorts?, filter?) → PageObjectResponse[]` | Paginated data source query |
| `fetchAndMap<T>` | `(dataSourceId, mapper, sorts?, filter?) → T[]` | Query + map in one call |
| `getPageBlocks` | `(pageId) → BlockObjectResponse[]` | Paginated block fetching |
| `getChildBlocks` | `(blockId) → BlockObjectResponse[]` | Alias for getPageBlocks (nested content) |
| `getChildPages` | `(parentId) → {id, title}[]` | Discover child pages under a parent |

**Key patterns:**
- Lazy client initialization via `getClient()` — only creates the `Client` when first needed
- Uses Notion SDK v5 API: `dataSources.query()` with `data_source_id` (not the removed `databases.query()`)
- All property extractors accept `PageProperty | undefined` — safely returns defaults for missing properties
- Uses the SDK's discriminated union type `PageProperty` — no `any`
- Error handling: try/catch with `[notion]` module prefix and descriptive messages
- Missing env var guard: returns empty array with console.warn

#### `notion-blocks.ts` — Block Transformer (~230 LOC)

Transforms Notion API `BlockObjectResponse[]` into serializable `ContentBlock[]`.

| Export | Signature | Purpose |
|---|---|---|
| `transformBlocks` | `(blocks) → ContentBlock[]` | Main entry point — convert + group |

**Internal functions:**
- `blockToContentBlock()` — switch on 22+ block types, returns null for unsupported
- `fetchAndTransformChildren()` — recursive child block resolution

**Helper modules (extracted to keep file focused):**
- `notion-block-utils.ts` — `extractRichText()`, `extractMediaUrl()`, `createBaseBlock()`, `groupListItems()`
- `embed-config.ts` — `getEmbedConfig()` detects embed providers (YouTube, Vimeo, Miro, Figma, Plotly, Google Docs, Mol*) and returns aspect ratios
- `code-highlight.ts` — `highlightCode()` Shiki-based build-time syntax highlighting
- `image-cache.ts` — `downloadNotionImage()`, `downloadNotionFile()`, `downloadItemMedia()` (renamed from `downloadItemImages`), `isNotionS3Url()`, `hashUrlToFilename()`. Downloads Notion S3 images and videos (mp4/webm/mov) to `static/images/` and files (PDFs, etc.) to `static/files/` at build time. Auto-detects HEIC images (iPhone uploads) via magic bytes and converts to JPEG via `heic-convert`. Shared `downloadS3File()` internal with content-type safelist (includes `video/*`). Deduplicates via promise Map, falls back to original URL on failure.

**Supported block types:** paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, quote, callout, divider, image, code, bookmark, embed, video, table, audio, file, pdf, column_list, synced_block, equation

**Special handling:**
- **Tables:** Custom child-fetch path (table_row blocks bypass `transformBlocks` to avoid being dropped as unsupported)
- **Video blocks:** YouTube/Vimeo URLs auto-convert to embed type with responsive aspect ratios
- **Synced blocks:** Resolve `synced_from.block_id` for references vs own `block.id` for sources
- **Column lists:** Sequential child fetching to avoid Notion API rate limits

#### Content Fetcher Services (~283 LOC total, 5 files)

Thin mappers over `fetchAndMap<T>()`. Each owns one domain type.

| Service | LOC | Exports |
|---|---|---|
| `projects.service.ts` | ~88 | `getAllProjects()`, `getFeaturedProjects()` |
| `tools.service.ts` | ~79 | `getAllTools()`, `getFeaturedTools()`, `getToolBySlug()` |
| `resources.service.ts` | ~70 | `getAllResources()`, `groupByType()` |
| `about.service.ts` | ~30 | `getAboutContent()` |
| `page-content.ts` | ~16 | `getPageContent()` |

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

**Page content services** (about) use a different pattern — they fetch page blocks and transform them:
```
const rawBlocks = await getPageBlocks(pageId);
return transformBlocks(rawBlocks);
```

### `lib/components/` — UI Components (~660 LOC, 12 files)

Svelte components for rendering content. Card components receive typed props; Notion renderers handle rich content.

#### `LetterSidebar.svelte` (~145 LOC)

Floating RLM monogram sidebar inspired by mca.com.au. Three letters (R, L, M) in Plus Jakarta Sans uppercase are vertically spread on the homepage hero, then drift to a tight stacked monogram as the user scrolls — each letter at a different rate, creating a cascading wave effect. R stays fixed at the top; L and M float toward it via exponential decay interpolation (`1 - Math.exp(-rate * dt)`) in a RAF loop. Hamburger button at bottom toggles a slide-out nav overlay (state managed by parent via `$bindable`).

**Key patterns:**
- **Exponential decay scroll physics:** Letters drift toward scroll-derived targets at different rates (R=8, L=5, M=3) via `requestAnimationFrame` loop. Higher rate = snappier response. Creates a cascading wave where R arrives first and M trails behind.
- **Reactive architecture:** `targets`/`current` are plain arrays (no `$state`) — RAF reads them without creating Svelte dependencies. `displayPositions` is `$state` to drive template updates. `reducedMotion` is `$state` so RAF loop restarts if OS setting changes.
- **Effect ordering:** Target sync effect declared before RAF effect — Svelte 5 runs effects in declaration order within a flush.
- **Responsive two-tier sizing:** md (768px+) uses 68px sidebar / 60px font; lg (1024px+) uses 80px sidebar / 72px font. R_TOP is 0px at md, -12px at lg.
- **Cross-component coupling:** Reads `[data-hero]` attribute from `+page.svelte` to determine scroll range. No hero → always collapsed.
- **`prefers-reduced-motion`:** Forces `heroHeight=0` → letters always collapsed, snap to targets on every scroll (no RAF)
- **Gap interpolation:** Single `gap` value interpolated between `spreadGap` and `collapsedGap`, target positions = `[R_TOP, R_TOP+gap, R_TOP+gap*2]` — guarantees equal spacing
- **`$bindable` menuOpen prop:** Parent binds `sidebarMenuOpen` state. Hamburger button toggles it. X icon shows when open. `aria-expanded` and dynamic `aria-label` for accessibility.
- **Dark mode:** Sidebar and slide-out panel use `dark:bg-hero` (Deep Twilight) with `dark:text-hero-foreground` for letters/links. Borders switch to `dark:border-white/10`.
- **Mobile menu styling:** The mobile hamburger dropdown (< md) uses `text-2xl font-bold uppercase tracking-wide` links matching homepage StickySection heading style, with Ultra Violet active text + Neon Chartreuse underline bar.

#### `ThemeToggle.svelte` (~29 LOC)

Dark mode toggle using Lucide Sun/Moon icons. Uses Svelte 5 `$state` for theme tracking. Persists preference to `localStorage` and applies `.dark` class on `<html>`. Accepts optional `class` prop for contextual color overrides (light text on dark hero backgrounds).

#### `NotionBlocks.svelte` (16 LOC)

Simple iterator. Takes `blocks: ContentBlock[]` prop, renders each via `<NotionBlock>`.

#### NotionBlock Dispatcher + Sub-Components (~300 LOC total, 5 files)

`NotionBlock.svelte` (~33 LOC) is a thin dispatcher routing blocks to sub-components by type set:
- `NotionTextBlock.svelte` (~87 LOC) — paragraphs, headings, lists, to_do, toggle, quote, callout. Paragraphs use `font-normal md:font-medium` (400 on mobile, 500 on desktop); lists use `font-normal` (400) to override the blanket mobile 700 boost.
- `NotionMediaBlock.svelte` (~130 LOC) — images, video, audio, code (Shiki), embed (responsive), bookmark, file, pdf, equation
- `NotionLayoutBlock.svelte` (~63 LOC) — dividers, tables, column layouts, synced blocks

Shared rendering utilities in `notion-render-utils.ts` (~46 LOC):
- `renderRichTextToSafeHtml()` — XSS-safe HTML from `RichTextSpan[]` (all text goes through `escapeHtml()`)
- `hasContent()` — checks if rich text array has any non-empty text

**Key patterns:**
- Circular import: `NotionTextBlock` → `NotionBlock` (dispatcher) for recursive nested lists/toggles. Svelte 5 handles via lazy resolution.
- Code blocks prefer `highlightedHtml` (Shiki output) with fallback to plain `<pre><code>`
- Embeds use responsive `aspect-ratio` CSS from `embedAspectRatio` field + provider-specific CSS classes
- Tables render with optional `<thead>` based on `hasHeader`, cells via `renderRichTextToSafeHtml()`
- Column lists render as responsive grid: `grid-cols-1 sm:grid-cols-{n}`
- Empty state handling: files, equations, and embeds skip rendering if primary data is empty

### `routes/` — SvelteKit Pages (~550 LOC, 18 files)

All 7 pages are fully wired to Notion data. Each route has a `+page.server.ts` (data loading) and `+page.svelte` (rendering).

| Route | Purpose | Data Source |
|---|---|---|
| `/` | Homepage with hero + featured items | `getFeaturedProjects/Tools`, `getAllResources` |
| `/about` | Bio rendered from Notion page | `getAboutContent()` |
| `/projects` | Project card grid | `getAllProjects()` |
| `/open-source` | Tool card grid | `getAllTools()` |
| `/resources` | Resources grouped by type | `getAllResources()` + `groupByType()` |
| `/projects/[slug]` | Project detail page | `getPageContent()` + project metadata |
| `/open-source/[slug]` | Tool detail page | `getPageContent()` + tool metadata |
| `/resources/[slug]` | Resource detail page | `getPageContent()` + resource metadata |
| `/contact` | Formspree form (client-side) | None — static HTML + JS |

### Design System (`app.css`, `app.html`)

The visual identity is defined in `app.css` (~240 LOC) using CSS custom properties with hex values and OKLCH color space.

**Color palette (5 custom colors, light + dark tokens):**
- Deep Twilight — primary backgrounds (hero, nav, footer, page headers)
- Ultra Violet — accents (borders, overlays, links, quotes)
- Neon Chartreuse — highlights (`.text-highlight` utility, tags, callouts)
- Two additional palette colors for supporting roles

**Typography:** Bodoni Moda (headings, logo — variable, optical size 6–96, weights 400–800) + Plus Jakarta Sans (body, weights 400–800). Loaded via Google Fonts CDN with preconnect hints in `app.html`. Mobile screens (< 768px) bump weights: body 400→700, headings→800 (Bodoni hairlines need max weight), bold→800 to compensate for thin strokes on small/high-DPI screens. Secondary text overrides the blanket 700 boost: card descriptions/captions/footer use `font-medium` (500); Notion paragraphs and list blocks use `font-normal` (400) on mobile, `font-medium` (500) on desktop.

**Animations:** `fadeUp`, `fadeIn`, `gradientShift` keyframes. Stagger animation support for up to 12 children via `--stagger-index` custom property.

**Dark mode:** `app.html` includes a blocking `<script>` to read `localStorage` before paint, preventing flash. Token values swap via `.dark` class on `<html>`.

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
                        │    (~263 LOC)   │   queryAllPages, fetchAndMap, getPageBlocks
                        └──┬──────────┬───┘
                           │          │
              ┌────────────┘          └──────────────┐
              │                                      │
   ┌──────────▼──────────┐   ┌───────────────────────▼──────────────────┐
   │  Database Services  │   │         notion-blocks.ts (230 LOC)       │
   │  projects (63)      │   │  ┌───────────────┐ ┌──────────────────┐  │
   │  tools (53)         │   │  │ block-utils   │ │  embed-config    │  │
   │  resources (52)     │   │  │  (85 LOC)     │ │   (53 LOC)       │  │
   └──────────┬──────────┘   │  └───────────────┘ └──────────────────┘  │
              │              │  ┌───────────────────────────────────┐    │
              │              │  │  code-highlight (82 LOC, Shiki)  │    │
              │              │  └───────────────────────────────────┘    │
              │              └────────────────────┬─────────────────────┘
              │                                   │
   ┌──────────▼──────────┐   ┌────────────────────▼────────────────────┐
   │  Page Services      │   │       Svelte Components                 │
   │  about (33)         │   │  NotionBlock (33) → dispatcher          │
   │                     │   │    ├── NotionTextBlock (87)             │
   └──────────┬──────────┘   │    ├── NotionMediaBlock (130)           │
              │              │    ├── NotionLayoutBlock (63)            │
              │              │    └── notion-render-utils (46)          │
              │              └────────────────────┬────────────────────┘
              │                                   │
              └───────────┬───────────────────────┘
                          │
                 ┌────────▼────────┐
                 │  content.ts     │  ← Shared types: Project, Tool, Resource,
                 │   (~149 LOC)    │    ContentBlock, RichTextSpan
                 └─────────────────┘
```

**Dependency rules:**
- `content.ts` has zero dependencies (pure types)
- `notion.service.ts` depends only on `@notionhq/client` and `$env`
- `notion-blocks.ts` depends on `notion.service.ts` (child block fetching), `notion-block-utils.ts`, `embed-config.ts`, `code-highlight.ts`, and `content.ts`
- `notion-block-utils.ts` depends only on `@notionhq/client` types and `content.ts`
- `embed-config.ts` has zero dependencies (pure utility)
- `code-highlight.ts` depends on `shiki` (dev only)
- `notion-render-utils.ts` depends only on `content.ts`
- Database services depend on `notion.service.ts` and `content.ts`
- Page services depend on `notion.service.ts`, `notion-blocks.ts`, and `content.ts`
- Components depend only on `content.ts` (receive typed data, never call services)
- Routes depend on services (in `+page.server.ts`) and components (in `+page.svelte`)

**External dependencies (runtime):**
- `@lucide/svelte` — icon components (Github, Linkedin, Mail, Sun, Moon, ArrowRight, Send)
- Google Fonts CDN — Bodoni Moda (variable) + Plus Jakarta Sans, loaded via `<link>` in `app.html`

---

## 4. LOC Summary

| Module | LOC | Files |
|---|---|---|
| Notion block transformer + utils | ~450 | 4 (notion-blocks, block-utils, embed-config, code-highlight) |
| Notion client + fetcher | ~263 | 1 |
| NotionBlock dispatcher + sub-components | ~340 | 5 (dispatcher, 3 sub-components, render-utils) |
| Card components + ThemeToggle + LetterSidebar | ~240 | 5 |
| Design system (app.css + app.html) | ~260 | 2 |
| Content types | ~149 | 1 |
| Content fetcher services | ~283 | 5 |
| Routes (pages + layouts) | ~550 | 21 |
| Utilities + config | 27 | 3 |
| **Tests** | **~1,000** | **11** |
| **Total** | **~3,450** | **54** |

> Tests are ~30% of total LOC. 144 tests across 11 files covering 23+ block types (incl. pdf), image + file caching, float physics, XSS safety, and all service mappers.
