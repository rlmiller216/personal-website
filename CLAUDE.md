# Personal Website — Rebecca Miller

> A scientist committed to the greater good. Static site powered by Notion as CMS.

## Quick Start

```bash
# Node.js is installed at ~/local/nodejs/ — ensure PATH includes it
export PATH="$HOME/local/nodejs/node-v22.15.0-darwin-arm64/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
npm install
npm run dev          # localhost:5173
npm run build        # static HTML → build/
npx vitest run       # tests
npx svelte-check     # type checking
```

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | SvelteKit + adapter-static | Static output, component-based DX, Svelte 5 runes |
| Styling | Tailwind CSS 4 | CSS-based config, utility-first styling |
| CMS | Notion API (@notionhq/client) | Rebecca already uses Notion daily. Edit there → site rebuilds |
| Hosting | Netlify (free tier) | Static hosting, auto-deploys on push to `main` |
| Contact Form | Formspree | adapter-static can't do server-side form handling |
| Typography | Bodoni Moda + Poppins (Google Fonts) | Didone serif headings + geometric sans body |
| Icons | Lucide + Phosphor (phosphor-svelte) | Lucide for UI icons (arrows, sun/moon); Phosphor filled for social/brand icons (GitHub, LinkedIn, envelope) |
| Syntax Highlighting | Shiki (dev only) | Build-time code highlighting, dual-theme dark mode via CSS variables, 0 client JS |
| Image Conversion | heic-convert (dev only) | Build-time HEIC→JPEG for iPhone uploads via Notion, 0 client JS |

## Architecture

**Static site generated at build time.** Every page is pre-rendered HTML. No server at runtime.

```
Notion databases/pages
  → SvelteKit +page.server.ts (build time)
    → fetchAndMap<T>() generic fetcher
      → Type-specific mapper (Project, Tool, Resource)
        → Static HTML pages
```

**Key pattern:** ONE generic `fetchAndMap<T>()` function instead of 5 near-identical modules. Each service is thin — just a mapper function + call to the generic fetcher.

**Shared service utilities:**
- `createCachedFetcher<T>()` — generic promise-based cache factory used by all 3 data services. Safe under concurrent adapter-static `load()` calls.
- `warnSlugCollisions()` — detects empty/duplicate slugs at build time. Used by all 3 data services.
- `getPageContent()` (in `page-content.ts`) — convenience function combining `getPageBlocks()` + `transformBlocks()`. Used by detail routes and about.service. Lives in a separate file to avoid circular dependency (`notion-blocks.ts` → `notion.service.ts`).
- `parseImageWidth()` (in `notion-blocks.ts`, private) — strips `[w:N]` prefix from image captions, returns width percentage (1–100) + cleaned caption. Lets Rebecca control image width from Notion by typing `[w:50]` at the start of any image caption.

**Notion blocks → Svelte components** (NOT `{@html}` strings). Server transforms API blocks into serializable `ContentBlock[]`, then `<NotionBlocks>` renders them as styled Svelte components. This enables per-block Tailwind styling and eliminates XSS risk.

**NotionBlock dispatcher pattern:** `NotionBlock.svelte` is a thin dispatcher (~33 lines) that routes blocks to three sub-components by type: `NotionTextBlock` (paragraphs, headings, toggle headings, lists, toggles, quotes, callouts), `NotionMediaBlock` (images, video, audio, code, embeds, bookmarks, files, equations), and `NotionLayoutBlock` (dividers, tables, column layouts, synced blocks). Circular import (NotionTextBlock → NotionBlock) enables recursive rendering of nested lists/toggles/toggle headings — Svelte 5 handles this via lazy resolution.

**Smart embed detection:** Embed and video blocks are analyzed via `getEmbedConfig()` (in `embed-config.ts`) to detect providers (YouTube, Vimeo, Miro, Figma, Plotly, Google Docs, Mol*) and set responsive aspect ratios, min-heights, and loading strategy. Embed min-height uses `min(configured, 70vh)` to prevent overflow on mobile viewports. YouTube/Vimeo video blocks are automatically converted to embed type to prevent broken `<video>` tags. Mol* embeds use a `snapshot-url` parameter to load pre-configured 3D protein visualizations from `.molx` session files in `static/molstar/`. Requires CORS headers on Netlify (`static/_headers` sets `Access-Control-Allow-Origin: *` for `/molstar/*`). Mol* embeds use `loading="eager"` (not lazy) because iOS Safari's lazy loading breaks WebGL context initialization in iframes — the browser never retries after the initial failed visibility check.

**Build-time syntax highlighting:** Code blocks are highlighted via Shiki at build time with dual-theme output (github-light/github-dark) using CSS variables. The Shiki highlighter uses a promise-cached singleton pattern (same as `createCachedFetcher`). Notion-to-Shiki language mapping handles display name differences. Unknown languages fall back to plaintext.

**XSS contract:** All rich text rendering uses `renderRichTextToSafeHtml()` (in `notion-render-utils.ts`) which passes ALL user text through `escapeHtml()` before annotation wrapping. Never bypass this for `{@html}` content.

**Detail pages** use `getPageContent()` to render Notion page content below structured metadata. `slugify()` in `content.ts` generates URL-safe slugs from titles. All detail page headers follow a standardized structure: title, pills row (Tier-1 category + Tier-2 tags + role/author in one flex-wrap row), and description subtitle — all rendered inside the Space Indigo header via `DetailHeader`'s children slot and `description` prop. **Database `Image` property** = card thumbnails + `og:image` meta tag only — never rendered visually on detail pages. Detail page media comes from Notion page content (via `NotionBlocks`). If Rebecca wants an image/video on a detail page, she adds it as a block in Notion.

## Design System

### Color Palette
| Hex | Name | Role |
|-----|------|------|
| `#6D3BFF` | Ultra Violet | Primary — links, buttons, active states |
| `#F6F5F4` | White Smoke | Light background |
| `#0D0D0D` | Onyx | Body text, dark mode base |
| `#eeff5d` | Neon Chartreuse | Secondary — highlights, CTAs, energy |
| `#1D2440` | Space Indigo | Dark background — hero, footer, dark mode |
| `#E8E0F3` | Pill Accent | Solid light purple tier-1 pill background (default) |
| `#F2EDF7` | Pill Accent Light | Lighter variant used on `.bg-card` (white) backgrounds |

### Typography
- **Headings:** Bodoni Moda (Didone serif, variable optical size). Bumped to font-weight 800 (extrabold) on mobile (< 768px) — hairline strokes need max weight on small/high-DPI screens.
- **Body:** Poppins (geometric sans-serif). Weights 300–900 loaded from Google Fonts.
- **Mobile weight reduction:** On mobile (< 768px), Poppins weights shift down: `font-medium` (500) → 400, default body (400) → 300, `font-normal` (400) → 300. Implemented via unlayered CSS overrides that beat Tailwind utilities. Secondary text elements use `font-medium` (500 desktop / 400 mobile). Applies to: card descriptions, Notion paragraphs, media captions, detail header back link + description, footer tagline + copyright, and contact form inputs.

### Font Utilities
- `font-display` — applies Bodoni Moda. Use on non-heading elements that need the display font (e.g., footer branding `<p>`).
- `font-body` — applies Poppins. Use on heading elements (`<h1>`–`<h4>`) that need to override the base Bodoni Moda rule.
- Headings get Bodoni Moda from base CSS (`@layer base`). Body text gets Poppins from `body`. No inline `style="font-family:..."` — use utility classes instead.

### Card Border Patterns
- ProjectCard: `border-b-4 border-b-secondary` (Neon Chartreuse bottom)
- ToolCard: `border border-border` (subtle border, image-forward card with category badge, used on /open-source subpage)
- ToolListItem: `border-l-4 border-l-primary` (Ultra Violet left, homepage Open Source cards)
- ResourceCard: `border border-border border-b-4 border-b-secondary` (Neon Chartreuse bottom, matches ProjectCard)

### Two-Tier Pill System
- **Tier-1** (category/sector/type): `font-semibold uppercase tracking-wider text-pill-accent-foreground bg-pill-accent` — solid light purple background via `--pill-accent` CSS variable
- **Tier-2** (tags): `font-medium bg-secondary text-secondary-foreground` — Neon Chartreuse
- **Contextual pill color**: `--pill-accent` defaults to `#E8E0F3` (oklch 0.919 0.027 305), overridden to lighter `#F2EDF7` inside `.bg-card` elements
- **Homepage pill size**: `rounded-full px-2 py-px text-[0.65rem] gap-1` (standardized across all cards)
- **Detail page pill size**: `rounded-full px-2.5 py-0.5 text-xs gap-2` (slightly larger for readability)

### Key Patterns
- `overflow-x: hidden` on `html` — prevents horizontal bounce on mobile from elements slightly exceeding viewport width
- Hex + OKLCH design tokens in `app.css` with light/dark mode. Brand-critical colors use hex directly (`#1D2440` Space Indigo, `#eeff5d` Neon Chartreuse) to prevent OKLCH approximation drift. Dark mode variants use `color-mix()` (e.g., `color-mix(in oklch, #1D2440 85%, white)`). `--hero`/`--hero-foreground` tokens power Space Indigo sections.
- **Floating RLM letter sidebar** (inspired by mca.com.au): R stays fixed at top (0px md, -12px lg), L and M drift toward it on scroll via exponential decay interpolation in a RAF loop. Each letter has a different damping rate (R=8, L=5, M=3) creating a cascading wave where R arrives first and M trails behind. Collapse range extends 1.8× beyond hero height for a slow, cinematic feel. Responsive two-tier sizing: 68px/60px font at md, 80px/72px font at lg. Hidden on mobile.
- **Non-fixed nav**: nav scrolls away naturally on ALL screen sizes (`relative z-10 bg-transparent`). Always transparent with light text — all page headers extend behind nav via `-mt-16 pt-16 bg-hero`. Footer nav links serve as persistent navigation once the header scrolls away on mobile.
- **MCA-style sticky section headers** on homepage: each section's heading sticks at `top-0` on all screen sizes. Title is a link with bold angular Ultra Violet arrow. No shadow on sticky headers.
- **Angular icon convention**: all custom SVGs use `stroke-linecap="square"` + `stroke-linejoin="miter"` to match Poppins's geometric character. Applies to hamburger, section arrows, and close icons.
- **Sidebar hamburger menu**: large angular icon (52px lg, 36px md) matching RLM letter color and width. Opens slide-out nav (w-80) with bold uppercase Poppins links, top-aligned with R. Panel is `bg-white` / `dark:bg-hero` (Space Indigo in dark mode). fly/fade Svelte transitions, Escape dismisses, mutual exclusion with mobile menu.
- **Dark mode sidebar/nav**: LetterSidebar and slide-out panel use `dark:bg-hero` (Space Indigo) with `dark:text-hero-foreground` for letters and links. Borders switch to `dark:border-white/10`.
- Space Indigo page headers on all content pages with `-mt-16 pt-16` nav overlap, `text-4xl sm:text-5xl lg:text-6xl` Bodoni Moda headings, compact `py-8 sm:py-10` padding
- Neon Chartreuse `.text-highlight` marker underline effect on last word of every page heading
- Stagger fade-up animations (up to 12 children), gated behind `prefers-reduced-motion`
- Cards always link to internal detail pages; external URLs shown as CTA buttons on detail pages
- **Hero headline typography**: 3-part typographic split (lead / bridge / highlight). BRIDGE_WORDS (`for`, `the`, `of`, `and`, etc.) render smaller and faded as visual connectors between lead word and highlight. `text-5xl md:text-6xl lg:text-[5.5rem]` with `leading-[1]` for tight line spacing. Asymmetric padding shifts content upward (`pt-20 pb-28` → `lg:pt-32 lg:pb-48`).
- **Card layout order**: All homepage cards follow Title → Description → Tags (at bottom). Role/position NOT shown on homepage cards (too busy). Detail pages show role in Neon Chartreuse below sector/tags.
- Card hovers: translate-up + shadow + purple title highlight + arrow reveal (all card types)
- **Feature card** for first project on homepage: full-width image with Space Indigo gradient overlay, hover scale. Falls back to standard grid if project has no image.
- **Varied card layouts per section**: Projects use feature card + grid (Neon Chartreuse bottom), Open Source uses image cards with Ultra Violet left border, Toolkit uses ResourceCard grid (Neon Chartreuse bottom).
- Homepage section banding: muted → white → muted (first section gets warm beige)
- **Autoplay video cards**: Cards support `<video autoplay loop muted playsinline>` for mp4/webm thumbnails. `CardMedia.svelte` handles video/image detection, poster frame from multi-file Notion properties, and `prefers-reduced-motion` pause (same pattern as LetterSidebar). Detection via `isVideoUrl()` on resolved local paths. Video content guidance: short clips (5-15s), < 10MB, mp4/webm preferred; `.mov` has partial browser support.
- **Footer**: Space Indigo background, Bodoni Moda "Rebecca L Miller, PhD" branding (`font-bold`, 700), "Science for Good" tagline (`font-medium`, 500 desktop / 400 mobile), land acknowledgement in Bodoni Moda (`#c3bdb8` at 70% opacity, `text-base`), nav links match header styling (`font-medium text-hero-foreground/70 hover:text-hero-foreground`), copyright (`font-medium`, 500 desktop / 400 mobile)
- **Nav logo**: `text-3xl font-extrabold` (800) on mobile, invisible on md+ (RLM sidebar replaces it)

### Accessibility Constraints
- **Neon Chartreuse on light bg: ~1.3:1 -- NEVER use as text.** Background/highlight only.
- Ultra Violet on White Smoke: ~4.7:1 -- OK for large text; use Onyx for body text
- Onyx on White Smoke: ~18:1 -- excellent for body text
- Neon Chartreuse on Space Indigo: ~10:1 -- excellent
- Video cards respect `prefers-reduced-motion`: CardMedia pauses video when reduced motion is preferred

## Project Structure

```
src/
  lib/
    components/
      ProjectCard.svelte    → Project display card
      ToolCard.svelte       → Open source tool card (used on /open-source subpage)
      ToolListItem.svelte   → Tool image card for homepage (Ultra Violet left border, hover arrow)
      CardMedia.svelte      → Shared card media (video/image with poster + reduced-motion pause)
      ResourceCard.svelte   → Resource card
      StickySection.svelte  → Sticky section header wrapper (homepage, linked title + angular arrow)
      ThemeToggle.svelte    → Dark mode toggle (Sun/Moon icons, localStorage, accepts class prop)
      LetterSidebar.svelte  → Floating RLM sidebar (RAF-driven exponential decay scroll physics) + hamburger menu toggle ($bindable)
      DetailHeader.svelte   → Shared detail page header (back link, title, pills slot, optional description subtitle)
      NotionBlocks.svelte   → Renders ContentBlock[] as Svelte components
      NotionBlock.svelte    → Block type dispatcher → routes to sub-components
      NotionTextBlock.svelte→ Text blocks: paragraphs, headings, lists, toggles, quotes, callouts
      NotionMediaBlock.svelte→ Media blocks: images, video, audio, code, embeds, bookmarks, files, PDFs, equations
      NotionLayoutBlock.svelte→ Layout blocks: dividers, tables, column layouts, synced blocks
      notion-render-utils.ts→ renderRichTextToSafeHtml(), escapeHtml(), hasContent()
    server/
      services/
        notion.service.ts   → Notion client + generic fetcher + property extractors (incl. getSelectOrMulti, getMediaFiles) + createCachedFetcher + warnSlugCollisions
        page-content.ts     → getPageContent() — combines getPageBlocks() + transformBlocks()
        projects.service.ts → Project mapper + queries (uses createCachedFetcher)
        tools.service.ts    → Tool mapper + queries (uses createCachedFetcher)
        resources.service.ts→ Resource mapper + queries (uses createCachedFetcher)
        about.service.ts    → About page fetcher (uses getPageContent)
        image-cache.ts      → Build-time Notion media downloader (images + video → static/images/, PDFs/files → static/files/, dedup, hash, HEIC→JPEG, fallback)
        notion-blocks.ts    → transformBlocks() — Notion API → ContentBlock[] (23+ block types incl. pdf); parseImageWidth() for [w:N] caption sizing
        notion-block-utils.ts→ Shared transform helpers: extractRichText, extractMediaUrl, groupListItems
        embed-config.ts     → URL pattern → embed provider/aspect-ratio detection
        code-highlight.ts   → Shiki syntax highlighting (promise-cached singleton, dual-theme)
    types/
      content.ts            → Project, Tool, Resource, ContentBlock interfaces + slugify() + isVideoUrl()
  routes/
    +layout.svelte          → Shared nav + footer + SEO meta + LetterSidebar
    +layout.server.ts       → Site metadata from env vars
    +layout.ts              → export const prerender = true
    +page.svelte            → Home page
    +page.server.ts         → Load featured items
    about/
    projects/
    projects/[slug]/        → Project detail page
    open-source/
    open-source/[slug]/     → Tool detail page
    resources/              → Toolkit
    resources/[slug]/       → Resource detail page
    contact/
    +error.svelte           → Runtime error page
static/
  robots.txt
  molstar/                  → Mol* 3D viewer session files (.molx)
  _headers                  → Netlify custom headers (CORS for /molstar/*)
tests/
  services/
    notion.service.test.ts
    image-cache.test.ts     → Image, video + file download, dedup, hash, content-type validation tests
    notion-blocks.test.ts   → Block transform tests (23+ block types incl. pdf, smart embeds, Shiki)
    notion-block-utils.test.ts → Shared block utilities (extractRichText, groupListItems)
    mappers.test.ts         → Tests for mapProject, mapTool, mapResource
    slug-collisions.test.ts → Tests for warnSlugCollisions
    embed-config.test.ts    → Embed provider detection (YouTube, Miro, Mol*, etc.)
    code-highlight.test.ts  → Shiki highlighting (language mapping, fallbacks)
  types/
    content.test.ts         → slugify(), isVideoUrl(), and type interface tests
  components/
    notion-render-utils.test.ts → XSS-safe rich text rendering
    float-physics.test.ts       → Exponential decay interpolation (smoothDamp)
```

## Site Structure

| Page | Route | Content Source |
|------|-------|---------------|
| Home | `/` | Featured items from all DBs |
| About | `/about` | Single Notion page |
| Projects | `/projects` | Notion database |
| Open Source | `/open-source` | Notion database |
| Toolkit | `/resources` | Notion database |
| Project Detail | `/projects/[slug]` | Notion database + page blocks |
| Tool Detail | `/open-source/[slug]` | Notion database + page blocks |
| Resource Detail | `/resources/[slug]` | Notion database + page blocks |
| Contact | `/contact` | Formspree form |

> **Note:** Interests page was removed (2026-03-16). Interests content (Poetry, Art, Music, Travel, Food) will be added to the About page in a future session.

## Notion Database Schemas

### Projects Database
| Property | Type | Purpose |
|----------|------|---------|
| Title | Title | Project name |
| Description | Rich text | What it does |
| Sector | Select/Multi-select | Product, Paper, Patent, Prototype (read via `getSelectOrMulti()`) |
| Status | Select | Active, Completed, Archived |
| Role | Text | Your role |
| Image | Files | Cover image or video. Upload video + thumbnail for poster support. |
| URL | URL | Link to project |
| Featured | Checkbox | Show on homepage? |
| Order | Number | Display order |
| Tags | Multi-select | Biotech, Food Science, etc. |

### Open Source Database
| Property | Type | Purpose |
|----------|------|---------|
| Title | Title | Tool name |
| Description | Rich text | What it does |
| Category | Select | Tool, Dataset, Guide, Template |
| GitHub URL | URL | Repo link |
| Demo URL | URL | Live demo |
| Tags | Multi-select | Python, Data, Biology, etc. |
| Featured | Checkbox | Show on homepage? |
| Files & media | Files | Preview image for card |
| Order | Number | Display order |

### Resources Database
| Property | Type | Purpose |
|----------|------|---------|
| Title | Title | Name |
| Description | Rich text | Short description |
| Type | Select | Book, Website, Podcast, Course, Newsletter |
| Category | Select | Science, Philosophy, Food, etc. |
| Author | Text | Creator |
| URL | URL | Link |
| Why I Love It | Rich text | Personal recommendation |
| Image | Files | Cover image |
| Featured | Checkbox | Show on homepage? |
| Order | Number | Display order |

### Notion SDK v5
- Uses `dataSources.query()` with `data_source_id` (NOT the removed `databases.query()`)
- Type: `QueryDataSourceParameters` (NOT `QueryDatabaseParameters`)
- Env vars use `$env/dynamic/private` (not static — dynamic doesn't need type declarations in app.d.ts)

### Notion API Gotchas
- Properties named "URL" must use `userDefined:URL` in Notion MCP tools (conflicts with internal `url` field)
- Notion API key format is `ntn_...` (not `secret_...` as older docs suggest)
- Integration must have **Read content** capability checked (not checked by default on new internal integrations)
- The `sorts` parameter in `dataSources.query()` must be an **array** of sort objects, not a single object (e.g., `[{ property: 'Order', direction: 'ascending' }]`)
- **Filter mismatch danger:** Featured queries must include the same Status filter as their `getAll` counterparts. If `getFeaturedX()` returns items excluded by `getAllX()`, the homepage links to detail pages that don't exist → prerender 404. Use compound `{ and: [...] }` filters.

## Environment Variables

```bash
# Notion
NOTION_API_KEY=ntn_...
NOTION_PROJECTS_DS_ID=...
NOTION_TOOLS_DS_ID=...
NOTION_RESOURCES_DS_ID=...
NOTION_ABOUT_PAGE_ID=...

# Site metadata — prefixed RM_ because Netlify reserves SITE_NAME
RM_SITE_NAME="RLM"
RM_SITE_TAGLINE="Science for Good"
RM_HERO_HEADLINE="Science for the Greater Good"
RM_HERO_INTRO="Building Tools for a Better World"
```

### Netlify Reserved Names
`SITE_NAME` is reserved by Netlify. All site metadata env vars use the `RM_` prefix instead.

## Documentation

- `docs/product-requirements.md` — MoSCoW feature tracking
- `docs/SRC_ARCHITECTURE.md` — Source code map, module inventory, dependency graph
- `docs/SYSTEM_ARCHITECTURE.md` — Notion→SvelteKit→Netlify pipeline, domain model
- `docs/WORKFLOWS.md` — Content authoring, build pipeline, block rendering, error handling
- `docs/MEMORY_ARCHITECTURE.md` — 3-layer memory system (hot/warm/cold pattern)

## Memory System

Machine-local memory at `~/.claude/projects/.../memory/` persists user profile, project decisions, and skill preferences across sessions. Not in git. See `docs/MEMORY_ARCHITECTURE.md` for the full design.

## Tests

- 169 tests across 11 files: `notion.service.test.ts` (35) + `notion-blocks.test.ts` (35) + `notion-block-utils.test.ts` (10) + `mappers.test.ts` (15) + `slug-collisions.test.ts` (6) + `content.test.ts` (12) + `embed-config.test.ts` (11) + `code-highlight.test.ts` (6) + `notion-render-utils.test.ts` (12) + `float-physics.test.ts` (5) + `image-cache.test.ts` (21 — image + video + file download, dedup, hash, content-type validation)
- Includes undefined-property guard tests (prevents crashes when Notion DB schema changes)
- Mapper tests verify all 3 service mappers with complete/missing/empty properties
- Slug collision tests verify warning/error logging for empty and duplicate slugs
- Block transform tests cover 23+ block types including PDF blocks, toggle headings, smart embed detection, video→embed conversion, table custom child-fetch, column list, synced blocks, Shiki highlighting, and image caption width hints (`[w:N]`)
- Mock Notion SDK responses — no live API calls in tests
- Run: `npm test` or `npx vitest run`

## Development Rules

> Full rules in ~/Documents/Claude Projects/claude-memory-kit/modules/bible/DEVELOPMENT-BIBLE.md

### Prime Directive
Rebecca will never debug this code. Claude will. Optimize for immediate comprehension, zero-maintenance reliability, and log trails a non-coder can understand.

### Key Rules
- **Files under 200 lines.** Split at 300. Never hit 500.
- **One file, one job.** Name like a headline.
- **No `any`. No `@ts-ignore`.** Strict TypeScript.
- **Functions under 30 lines.** Functions over classes. Named exports.
- **Comments explain why.** Code explains what.
- **No abstractions without 3 uses.**
- **No half-finished work.** Ship complete or don't commit.
- **Dead code is a lie.** Delete it.
- **Tests ship with every feature.** No exceptions.

### Naming Conventions
| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.svelte` | `ProjectCard.svelte` |
| Services | domain + `.service.ts` | `notion.service.ts` |
| Types | camelCase `.ts` in `lib/types/` | `content.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_FEATURED_ITEMS` |
| Routes | kebab-case dirs | `open-source/` |
| Tests | same name + `.test.ts` | `notion.service.test.ts` |

### Error Handling
Errors are written for humans:
- Bad: `TypeError: Cannot read property 'title' of undefined`
- Good: `[notion] Failed to fetch project "X" — property "Name" missing or empty`

### Logging
- Every module logs its name: `[notion]`, `[projects]`, `[resources]`
- Format: `[module] action: detail`
- Never log secrets

### Anti-Patterns for This Project
| Temptation | Do This Instead |
|------------|----------------|
| Hardcode content in templates | Fetch from Notion API |
| Use Inter/Roboto/Arial fonts | Distinctive typography per aesthetics directive |
| Install heavy JS frameworks | SvelteKit + adapter-static. Minimal JS. |
| Custom CMS/admin panel | Notion IS the CMS |
| Silent try/catch on Notion API | Crash with context |
| `utils.ts` / `helpers.ts` | Name by domain |
| 5 identical fetcher modules | Generic fetcher + type-specific mappers |
| Separate backend | adapter-static. Formspree for forms. |
| Use Neon Chartreuse as text on light bg | Background/highlight only — fails WCAG contrast |
| Approximate/guess color space conversions | Use exact hex or OKLCH from user. If conversion needed, use programmatic tool — never eyeball |
| Use `loading="lazy"` on WebGL iframes | Set `loading: 'eager'` in embed-config.ts — iOS Safari breaks WebGL context init with lazy loading |
| Render database Image on detail pages | Database Image = cards + og:image only. Detail page media comes from NotionBlocks |
| Hardcode image sizes in components | Use `[w:N]` caption prefix in Notion (e.g. `[w:50] caption text`) — parsed at build time, stripped from display |

## Known Limitations & Mitigations

### Media Caching (Build-Time Download)
Notion S3 signed URLs expire after ~1 hour. At build time, `image-cache.ts` downloads all Notion S3 files: images and videos to `static/images/` and other files (PDFs, docs, etc.) to `static/files/`. Both rewrite to permanent `/{dir}/{hash}.ext` paths. A shared `downloadS3File()` function handles both paths with a content-type safelist (rejects S3 XML/HTML error pages). Videos (mp4, webm, mov) are cached alongside images in `static/images/`. HEIC images (iPhone uploads via Notion) are auto-detected by magic bytes and converted to JPEG via `heic-convert`. The dedup `Map<pathname, Promise>` prevents concurrent download races during prerender. Failed downloads fall back to the original S3 URL. Post-build `cp -f` copies file contents (not dirs) from `static/images/*` and `static/files/*` to `build/` — using `*` glob avoids nested directories when Vite's snapshot already created the target dir. Both directories are gitignored. The `handleHttpError` in `svelte.config.js` ignores 404s for `/images/` and `/files/` paths during prerender (files are downloaded mid-prerender, after Vite's snapshot).

### Netlify Free Tier Limits (300 credits/month)
Each production deploy costs ~15 credits. The free tier allows ~20 deploys/month. **Do not enable scheduled build hooks** — even a 6-hourly hook would consume 2,700 credits/month. Use push-triggered deploys only, plus manual "Trigger deploy" from the Netlify dashboard for content refreshes.

### Tailwind CSS 4
Uses CSS-based configuration (`@import "tailwindcss"`) instead of v3's JS config. Follow whatever `npx sv add tailwindcss` generates.

### CLI Quirks
- `npx sv create` and `npx sv add` require clean git working directory or `--skip-preflight`
- Tailwind CSS 4 setup: install `tailwindcss` + `@tailwindcss/vite`, add plugin to `vite.config.ts`, use `@import 'tailwindcss'` in `app.css`

### Google Fonts via CDN
Bodoni Moda and Poppins load from Google Fonts CDN. Potential FOUC on slow connections. If this becomes a problem, self-host the font files in `static/fonts/`.

### Slugs Derived from Titles
Slugs are generated at build time from Notion titles via `slugify()`. If Rebecca renames an item in Notion, old URLs break after the next build. No redirect system exists yet.

### Property Extractors Accept `undefined`
All property extractors (`getTitle`, `getRichText`, etc.) accept `PageProperty | undefined`. This prevents crashes when a Notion database doesn't have an expected property name. Tested with 8 dedicated undefined-guard tests.

## Design Pipeline

For UI feature development, use these skills in order:

1. `/spec` — Interview the user, research the domain, produce a structured Design Spec
2. `/logic` — Resolve non-visual decisions (policies, flows, states) with evidence-based research
3. `/design` — Generate working Svelte 5 prototype variants, let the user pick winners, iterate

Session artifacts are stored in `~/memory/sessions/`.

## Content Workflow

1. Rebecca edits content in Notion (databases + pages)
2. Push to GitHub auto-triggers Netlify build, or manually trigger via Netlify dashboard
3. SvelteKit fetches all content from Notion API at build time
4. adapter-static generates pure HTML/CSS/JS
5. Netlify serves the static files

**Rebecca never touches code.** All content changes happen in Notion.

## Deployment

- **Live site:** https://rlmiller.netlify.app
- **GitHub repo:** https://github.com/rlmiller216/personal-website
- **Hosting:** Netlify (free tier), auto-deploys on push to `main`
- **Build command:** `npm run build` → publish dir: `build`
- **Contact form:** Formspree endpoint `xbdzaneq`
- **Redeploy:** Push to GitHub (auto-deploys), or "Trigger deploy" in Netlify dashboard for content refreshes
- **⚠️ No scheduled build hooks** — free tier only allows ~20 deploys/month (300 credits, ~15/deploy)
- **Hardcoded social links:** GitHub (`rlmiller216`) and LinkedIn (`rebeccalauriemiller`) are in `+layout.svelte` footer — not env vars

