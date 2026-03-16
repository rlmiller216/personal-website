# Source Architecture

Map of everything under `src/`, how it connects, and where to find things.

---

## 1. High-Level Folder Tree

```
src/
├── app.css                               # Design system: OKLCH color tokens, typography, animations (~165 LOC)
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
│   │   └── content.ts                    # Domain interfaces: Project, Tool, Resource, ContentBlock
│   │
│   ├── components/
│   │   ├── ProjectCard.svelte            # Project card: hover translate-up, Ultra Violet overlay (~45 LOC)
│   │   ├── ToolCard.svelte               # Tool card: Ultra Violet top border, Lime tags (~35 LOC, used on /open-source)
│   │   ├── ToolListItem.svelte           # Tool list-item: Ultra Violet left border, hover arrow (~40 LOC, homepage)
│   │   ├── ResourceCard.svelte           # Resource card: Ultra Violet left border, styled quotes (~35 LOC)
│   │   ├── StickySection.svelte          # Sticky section header: IntersectionObserver shadow, "View all →" (~70 LOC)
│   │   ├── ThemeToggle.svelte            # Dark mode toggle: Sun/Moon icons, localStorage, class prop (~29 LOC)
│   │   ├── LetterSidebar.svelte          # Scroll-collapsing RLM sidebar + hamburger toggle, $bindable menuOpen (~105 LOC)
│   │   ├── NotionBlocks.svelte           # Iterates ContentBlock[] → renders each via NotionBlock
│   │   ├── NotionBlock.svelte            # Block type dispatcher → routes to sub-components (~33 LOC)
│   │   ├── NotionTextBlock.svelte        # Text blocks: paragraphs, headings, lists, toggles, quotes, callouts (~87 LOC)
│   │   ├── NotionMediaBlock.svelte       # Media blocks: images, video, audio, code, embeds, bookmarks, files, equations (~114 LOC)
│   │   ├── NotionLayoutBlock.svelte      # Layout blocks: dividers, tables, column layouts, synced blocks (~63 LOC)
│   │   ├── notion-render-utils.ts        # renderRichTextToSafeHtml(), escapeHtml(), hasContent() (~46 LOC)
│   │   └── ui/                           # shadcn-svelte auto-generated components
│   │
│   └── server/
│       └── services/
│           ├── notion.service.ts         # Notion API client, property extractors, generic fetcher, createCachedFetcher, warnSlugCollisions
│           ├── page-content.ts           # getPageContent() — combines getPageBlocks() + transformBlocks()
│           ├── notion-blocks.ts          # Block transformer: Notion API → ContentBlock[] (22+ types, ~230 LOC)
│           ├── notion-block-utils.ts     # Shared helpers: extractRichText, extractMediaUrl, groupListItems (~85 LOC)
│           ├── embed-config.ts           # URL pattern → embed provider/aspect-ratio detection (~53 LOC)
│           ├── code-highlight.ts         # Shiki syntax highlighting: promise-cached, dual-theme (~82 LOC)
│           ├── projects.service.ts       # Project mapper + queries (uses createCachedFetcher)
│           ├── tools.service.ts          # Tool mapper + queries (uses createCachedFetcher)
│           ├── resources.service.ts      # Resource mapper + queries (uses createCachedFetcher, groupByType)
│           ├── interests.service.ts      # Interest page fetcher (child pages → ContentBlock[])
│           └── about.service.ts          # About page fetcher (uses getPageContent)
│
└── routes/
    ├── +layout.svelte                    # Root layout: LetterSidebar + slide-out overlay, scroll-aware nav, ThemeToggle, Space Indigo footer (~210 LOC)
    ├── +layout.server.ts                 # Loads site metadata from RM_* env vars
    ├── +layout.ts                        # export const prerender = true (all routes static)
    ├── +page.svelte                      # Home: Space Indigo hero with data-hero attr, stagger animations (~100 LOC)
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
    ├── interests/
    │   ├── +page.svelte                  # Interest index (links to each topic)
    │   ├── +page.server.ts               # Lists all interest slugs/titles
    │   └── [slug]/
    │       ├── +page.svelte              # Individual interest page with cross-links
    │       └── +page.server.ts           # entries() for static generation + content fetch
    └── contact/
        └── +page.svelte                  # Formspree contact form (name/email/message)
```

---

## 2. Module Responsibilities

### `lib/types/` — Domain Types (~149 LOC, 1 file)

Pure TypeScript interfaces with zero dependencies. Defines the contract between services and components.

| Interface | Fields | Used By |
|---|---|---|
| `Project` | title, description, sector, status, role, imageUrl, url, featured, order | projects.service.ts, ProjectCard.svelte |
| `Tool` | title, description, category, githubUrl, demoUrl, tags, featured | tools.service.ts, ToolCard.svelte, ToolListItem.svelte |
| `Resource` | title, description, type, category, author, url, whyILoveIt, imageUrl | resources.service.ts, ResourceCard.svelte |
| `ContentBlock` | id, type, richText, children, url, caption, language, checked, icon | notion-blocks.ts, NotionBlock.svelte |
| `RichTextSpan` | text, annotations, href | ContentBlock.richText[], NotionBlock.svelte |
| `RichTextAnnotation` | bold, italic, strikethrough, underline, code, color | RichTextSpan.annotations |

### `lib/server/services/` — Notion Data Layer (~940 LOC, 10 files)

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
- `embed-config.ts` — `getEmbedConfig()` detects embed providers and returns aspect ratios
- `code-highlight.ts` — `highlightCode()` Shiki-based build-time syntax highlighting

**Supported block types:** paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item, to_do, toggle, quote, callout, divider, image, code, bookmark, embed, video, table, audio, file, column_list, synced_block, equation

**Special handling:**
- **Tables:** Custom child-fetch path (table_row blocks bypass `transformBlocks` to avoid being dropped as unsupported)
- **Video blocks:** YouTube/Vimeo URLs auto-convert to embed type with responsive aspect ratios
- **Synced blocks:** Resolve `synced_from.block_id` for references vs own `block.id` for sources
- **Column lists:** Sequential child fetching to avoid Notion API rate limits

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

### `lib/components/` — UI Components (~660 LOC, 12 files)

Svelte components for rendering content. Card components receive typed props; Notion renderers handle rich content.

#### `LetterSidebar.svelte` (~105 LOC)

Scroll-collapsing RLM monogram sidebar inspired by mca.com.au. Three letters (R, L, M) in Raleway uppercase are vertically spread on the homepage hero, then animate to a tight stacked monogram as the user scrolls past the hero. R stays fixed at the top; L and M collapse upward via gap interpolation with easeOutCubic easing. Hamburger button at bottom toggles a slide-out nav overlay (state managed by parent via `$bindable`).

**Key patterns:**
- **Responsive two-tier sizing:** md (768px+) uses 56px sidebar / 48px font; lg (1024px+) uses 80px sidebar / 72px font
- **Cross-component coupling:** Reads `[data-hero]` attribute from `+page.svelte` to determine scroll range. No hero → always collapsed.
- **`prefers-reduced-motion`:** Forces `heroHeight=0` → letters always collapsed, no animation
- **Gap interpolation:** Single `gap` value interpolated between `spreadGap` and `collapsedGap`, positions = `[R_TOP, R_TOP+gap, R_TOP+gap*2]` — guarantees equal spacing
- **`$bindable` menuOpen prop:** Parent binds `sidebarMenuOpen` state. Hamburger button toggles it. X icon shows when open. `aria-expanded` and dynamic `aria-label` for accessibility.

#### `ThemeToggle.svelte` (~29 LOC)

Dark mode toggle using Lucide Sun/Moon icons. Uses Svelte 5 `$state` for theme tracking. Persists preference to `localStorage` and applies `.dark` class on `<html>`. Accepts optional `class` prop for scroll-aware color overrides (light text on dark hero, dark text on solid nav).

#### `NotionBlocks.svelte` (16 LOC)

Simple iterator. Takes `blocks: ContentBlock[]` prop, renders each via `<NotionBlock>`.

#### NotionBlock Dispatcher + Sub-Components (~300 LOC total, 5 files)

`NotionBlock.svelte` (~33 LOC) is a thin dispatcher routing blocks to sub-components by type set:
- `NotionTextBlock.svelte` (~87 LOC) — paragraphs, headings, lists, to_do, toggle, quote, callout
- `NotionMediaBlock.svelte` (~114 LOC) — images, video, audio, code (Shiki), embed (responsive), bookmark, file, equation
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
| `/interests` | Index of interest topics | `getAllInterests()` (titles only) |
| `/interests/[slug]` | Individual interest page | `getInterestBySlug()` + `entries()` |
| `/contact` | Formspree form (client-side) | None — static HTML + JS |

### Design System (`app.css`, `app.html`)

The visual identity is defined in `app.css` (~165 LOC) using CSS custom properties with OKLCH color space.

**Color palette (5 custom colors, light + dark tokens):**
- Space Indigo — primary backgrounds (hero, nav, footer, page headers)
- Ultra Violet — accents (borders, overlays, links, quotes)
- Lime Yellow — highlights (`.text-highlight` utility, tags, callouts)
- Two additional palette colors for supporting roles

**Typography:** Bodoni Moda (headings, logo — variable, optical size 6–96, weights 400–800) + Raleway (body, weights 400–700). Loaded via Google Fonts CDN with preconnect hints in `app.html`.

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
                        │     (223 LOC)   │   queryAllPages, fetchAndMap, getPageBlocks
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
   │  interests (67)     │   │    ├── NotionTextBlock (87)             │
   └──────────┬──────────┘   │    ├── NotionMediaBlock (114)           │
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
- Google Fonts CDN — Bodoni Moda (variable) + Raleway, loaded via `<link>` in `app.html`

---

## 4. LOC Summary

| Module | LOC | Files |
|---|---|---|
| Notion block transformer + utils | ~450 | 4 (notion-blocks, block-utils, embed-config, code-highlight) |
| Notion client + fetcher | 223 | 1 |
| NotionBlock dispatcher + sub-components | ~340 | 5 (dispatcher, 3 sub-components, render-utils) |
| Card components + ThemeToggle + LetterSidebar | ~240 | 5 |
| Design system (app.css + app.html) | ~185 | 2 |
| Content types | ~149 | 1 |
| Content fetcher services | 268 | 5 |
| Routes (pages + layouts) | ~550 | 18 |
| Utilities + config | 27 | 3 |
| **Tests** | **~950** | **9** |
| **Total** | **~3,400** | **53** |

> Tests are ~28% of total LOC. The block expansion added ~900 LOC across 18 new/modified files with 118 tests covering 22+ block types.
