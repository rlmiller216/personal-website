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
| Styling | Tailwind CSS 4 + shadcn-svelte | CSS-based config, accessible components out of the box |
| CMS | Notion API (@notionhq/client) | Rebecca already uses Notion daily. Edit there → site rebuilds |
| Hosting | Netlify (free tier) | Static hosting, auto-deploys on push to `main` |
| Contact Form | Formspree | adapter-static can't do server-side form handling |
| Typography | Bodoni Moda + Raleway (Google Fonts) | Didone serif headings + geometric sans body |
| Icons | Lucide | Standard per Development Bible |
| Syntax Highlighting | Shiki (dev only) | Build-time code highlighting, dual-theme dark mode via CSS variables, 0 client JS |

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

**Notion blocks → Svelte components** (NOT `{@html}` strings). Server transforms API blocks into serializable `ContentBlock[]`, then `<NotionBlocks>` renders them as styled Svelte components. This enables per-block Tailwind styling and eliminates XSS risk.

**NotionBlock dispatcher pattern:** `NotionBlock.svelte` is a thin dispatcher (~33 lines) that routes blocks to three sub-components by type: `NotionTextBlock` (paragraphs, headings, lists, toggles, quotes, callouts), `NotionMediaBlock` (images, video, audio, code, embeds, bookmarks, files, equations), and `NotionLayoutBlock` (dividers, tables, column layouts, synced blocks). Circular import (NotionTextBlock → NotionBlock) enables recursive rendering of nested lists/toggles — Svelte 5 handles this via lazy resolution.

**Smart embed detection:** Embed and video blocks are analyzed via `getEmbedConfig()` (in `embed-config.ts`) to detect providers (YouTube, Vimeo, Miro, Figma, Plotly, Google Docs, Mol*) and set responsive aspect ratios. YouTube/Vimeo video blocks are automatically converted to embed type to prevent broken `<video>` tags. Mol* embeds use a `snapshot-url` parameter to load pre-configured 3D protein visualizations from `.molx` session files in `static/molstar/`.

**Build-time syntax highlighting:** Code blocks are highlighted via Shiki at build time with dual-theme output (github-light/github-dark) using CSS variables. The Shiki highlighter uses a promise-cached singleton pattern (same as `createCachedFetcher`). Notion-to-Shiki language mapping handles display name differences. Unknown languages fall back to plaintext.

**XSS contract:** All rich text rendering uses `renderRichTextToSafeHtml()` (in `notion-render-utils.ts`) which passes ALL user text through `escapeHtml()` before annotation wrapping. Never bypass this for `{@html}` content.

**Detail pages** use `getPageContent()` to render Notion page content below structured metadata. `slugify()` in `content.ts` generates URL-safe slugs from titles.

## Design System

### Color Palette
| Hex | Name | Role |
|-----|------|------|
| `#6D3BFF` | Ultra Violet | Primary — links, buttons, active states |
| `#F6F5F4` | White Smoke | Light background |
| `#0D0D0D` | Onyx | Body text, dark mode base |
| `#DFFF5C` | Lime Yellow | Secondary — highlights, CTAs, energy |
| `#1D2440` | Space Indigo | Dark background — hero, footer, dark mode |

### Typography
- **Headings:** Bodoni Moda (Didone serif, variable optical size). Bumped to font-weight 600 on mobile (< 768px) — hairline strokes vanish on small screens.
- **Body:** Raleway (geometric sans-serif)

### Font Utilities
- `font-display` — applies Bodoni Moda. Use on non-heading elements that need the display font (e.g., footer branding `<p>`).
- `font-body` — applies Raleway. Use on heading elements (`<h1>`–`<h4>`) that need to override the base Bodoni Moda rule.
- Headings get Bodoni Moda from base CSS (`@layer base`). Body text gets Raleway from `body`. No inline `style="font-family:..."` — use utility classes instead.

### Card Border Patterns
- ProjectCard: `border-b-4 border-b-secondary` (Lime Yellow bottom)
- ToolCard/ToolListItem: `border-l-primary` (Ultra Violet left)
- ResourceCard: `border border-border border-l-4 border-l-primary` (thin border + thick Ultra Violet left)

### Key Patterns
- `overflow-x: hidden` on `html` — prevents horizontal bounce on mobile from elements slightly exceeding viewport width
- OKLCH design tokens in `app.css` with light/dark mode (`--hero`, `--hero-foreground` for Space Indigo sections)
- **Scroll-collapsing RLM letter sidebar** (inspired by mca.com.au): R stays fixed at top (-12px), L and M animate upward on scroll to form a tight monogram. Collapse range extends 1.8× beyond hero height for a slow, cinematic feel. Responsive two-tier sizing: 56px/48px font at md, 80px/72px font at lg. Hidden on mobile.
- **Non-fixed desktop nav**: nav scrolls away naturally on desktop (`md:relative md:z-10`) so sticky section headers own the top of the viewport. Transparent at top of every page (all headers extend behind nav via `-mt-16 pt-16`), solid on scroll. Mobile nav stays fixed.
- **MCA-style sticky section headers** on homepage: each section's heading sticks at `top-16` (mobile, below fixed nav) or `top-0` (desktop). Title is a link with bold angular Ultra Violet arrow. No shadow on sticky headers.
- **Angular icon convention**: all custom SVGs use `stroke-linecap="square"` + `stroke-linejoin="miter"` to match Raleway's geometric character. Applies to hamburger, section arrows, and close icons.
- **Sidebar hamburger menu**: large angular icon (52px lg, 36px md) matching RLM letter color and width. Opens slide-out nav (w-80) with bold uppercase Raleway links, top-aligned with R. Panel is `bg-white` (matches sidebar). fly/fade Svelte transitions, Escape dismisses, mutual exclusion with mobile menu.
- Space Indigo page headers on all content pages with `-mt-16 pt-16` nav overlap, `text-4xl sm:text-5xl lg:text-6xl` Bodoni Moda headings, compact `py-8 sm:py-10` padding
- Lime Yellow `.text-highlight` marker underline effect on last word of every page heading
- Stagger fade-up animations (up to 12 children), gated behind `prefers-reduced-motion`
- Cards always link to internal detail pages; external URLs shown as CTA buttons on detail pages
- Card hovers: translate-up + accent borders (Lime Yellow bottom on ProjectCard, Ultra Violet left on ToolCard/ResourceCard)
- **Feature card** for first project on homepage: full-width image with Space Indigo gradient overlay, hover scale. Falls back to standard grid if project has no image.
- **Varied card layouts per section**: Projects use feature card + grid, Open Source uses list items with Ultra Violet left border, Resource Library uses existing card grid.
- Homepage section banding: muted → white → muted (first section gets warm beige)
- Footer: Space Indigo background with Ultra Violet accent line, Bodoni Moda "Rebecca L Miller, PhD" branding

### Accessibility Constraints
- **Lime Yellow on light bg: ~1.3:1 -- NEVER use as text.** Background/highlight only.
- Ultra Violet on White Smoke: ~4.7:1 -- OK for large text; use Onyx for body text
- Onyx on White Smoke: ~18:1 -- excellent for body text
- Lime Yellow on Space Indigo: ~10:1 -- excellent

## Project Structure

```
src/
  lib/
    components/
      ui/                   → shadcn-svelte (auto-generated, don't edit)
      ProjectCard.svelte    → Project display card
      ToolCard.svelte       → Open source tool card (used on /open-source subpage)
      ToolListItem.svelte   → Tool list-item layout for homepage (Ultra Violet left border, hover arrow)
      ResourceCard.svelte   → Resource card
      StickySection.svelte  → Sticky section header wrapper (homepage, linked title + angular arrow)
      ThemeToggle.svelte    → Dark mode toggle (Sun/Moon icons, localStorage, accepts class prop)
      LetterSidebar.svelte  → Scroll-collapsing RLM monogram sidebar + hamburger menu toggle ($bindable)
      DetailHeader.svelte   → Shared detail page header (back link, title, badge slot)
      NotionBlocks.svelte   → Renders ContentBlock[] as Svelte components
      NotionBlock.svelte    → Block type dispatcher → routes to sub-components
      NotionTextBlock.svelte→ Text blocks: paragraphs, headings, lists, toggles, quotes, callouts
      NotionMediaBlock.svelte→ Media blocks: images, video, audio, code, embeds, bookmarks, files, equations
      NotionLayoutBlock.svelte→ Layout blocks: dividers, tables, column layouts, synced blocks
      notion-render-utils.ts→ renderRichTextToSafeHtml(), escapeHtml(), hasContent()
    server/
      services/
        notion.service.ts   → Notion client + generic fetcher + property extractors + createCachedFetcher + warnSlugCollisions
        page-content.ts     → getPageContent() — combines getPageBlocks() + transformBlocks()
        projects.service.ts → Project mapper + queries (uses createCachedFetcher)
        tools.service.ts    → Tool mapper + queries (uses createCachedFetcher)
        resources.service.ts→ Resource mapper + queries (uses createCachedFetcher)
        about.service.ts    → About page fetcher (uses getPageContent)
        notion-blocks.ts    → transformBlocks() — Notion API → ContentBlock[] (22+ block types)
        notion-block-utils.ts→ Shared transform helpers: extractRichText, extractMediaUrl, groupListItems
        embed-config.ts     → URL pattern → embed provider/aspect-ratio detection
        code-highlight.ts   → Shiki syntax highlighting (promise-cached singleton, dual-theme)
    types/
      content.ts            → Project, Tool, Resource, ContentBlock interfaces + slugify()
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
    resources/              → Resource Library
    resources/[slug]/       → Resource detail page
    contact/
    +error.svelte           → Runtime error page
static/
  favicon.svg
  robots.txt
  404.html                  → Static 404 fallback (adapter-static)
  molstar/                  → Mol* 3D viewer session files (.molx)
tests/
  services/
    notion.service.test.ts
    notion-blocks.test.ts   → Block transform tests (22+ block types, smart embeds, Shiki)
    notion-block-utils.test.ts → Shared block utilities (extractRichText, groupListItems)
    mappers.test.ts         → Tests for mapProject, mapTool, mapResource
    slug-collisions.test.ts → Tests for warnSlugCollisions
    embed-config.test.ts    → Embed provider detection (YouTube, Miro, etc.)
    code-highlight.test.ts  → Shiki highlighting (language mapping, fallbacks)
  components/
    notion-render-utils.test.ts → XSS-safe rich text rendering
```

## Site Structure

| Page | Route | Content Source |
|------|-------|---------------|
| Home | `/` | Featured items from all DBs |
| About | `/about` | Single Notion page |
| Professional Projects | `/projects` | Notion database |
| Open Source | `/open-source` | Notion database |
| Resource Library | `/resources` | Notion database |
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
| Sector | Select | Food Tech, Climate Tech, AI for Science, etc. |
| Status | Select | Active, Completed, Archived |
| Role | Text | Your role |
| Image | Files | Cover image |
| URL | URL | Link to project |
| Featured | Checkbox | Show on homepage? |
| Order | Number | Display order |

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

### Resources Database
| Property | Type | Purpose |
|----------|------|---------|
| Title | Title | Name |
| Type | Select | Book, Website, Podcast, Course, Newsletter |
| Category | Select | Science, Philosophy, Food, etc. |
| Author | Text | Creator |
| URL | URL | Link |
| Why I Love It | Rich text | Personal recommendation |
| Image | Files | Cover image |

### Notion SDK v5
- Uses `dataSources.query()` with `data_source_id` (NOT the removed `databases.query()`)
- Type: `QueryDataSourceParameters` (NOT `QueryDatabaseParameters`)
- Env vars use `$env/dynamic/private` (not static — dynamic doesn't need type declarations in app.d.ts)

### Notion API Gotchas
- Properties named "URL" must use `userDefined:URL` in Notion MCP tools (conflicts with internal `url` field)
- Notion API key format is `ntn_...` (not `secret_...` as older docs suggest)
- Integration must have **Read content** capability checked (not checked by default on new internal integrations)

## Environment Variables

```bash
# Notion
NOTION_API_KEY=ntn_...
NOTION_PROJECTS_DS_ID=...
NOTION_TOOLS_DS_ID=...
NOTION_RESOURCES_DS_ID=...
NOTION_ABOUT_PAGE_ID=...
# No NOTION_INTERESTS_PAGE_ID — interests page removed (2026-03-16)

# Site metadata — prefixed RM_ because Netlify reserves SITE_NAME
RM_SITE_NAME="RLM"
RM_SITE_TAGLINE="Scientist committed to the greater good"
RM_HERO_HEADLINE="..."
RM_HERO_INTRO="..."
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

- 118 tests across 9 files: `notion.service.test.ts` (28) + `notion-blocks.test.ts` (26) + `notion-block-utils.test.ts` (10) + `mappers.test.ts` (15) + `slug-collisions.test.ts` (6) + `content.test.ts` (5) + `embed-config.test.ts` (10) + `code-highlight.test.ts` (6) + `notion-render-utils.test.ts` (12)
- Includes undefined-property guard tests (prevents crashes when Notion DB schema changes)
- Mapper tests verify all 3 service mappers with complete/missing/empty properties
- Slug collision tests verify warning/error logging for empty and duplicate slugs
- Block transform tests cover 22+ block types including smart embed detection, video→embed conversion, table custom child-fetch, column list, synced blocks, and Shiki highlighting
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
| Use Lime Yellow as text on light bg | Background/highlight only — fails WCAG contrast |

## Known Limitations & Mitigations

### Notion Image URLs Expire (~1 hour)
Signed S3 URLs expire. Each git push triggers a rebuild with fresh URLs. For content-only updates (no code change), use the Netlify dashboard "Trigger deploy" button. If staleness becomes a problem, future work: download images to `static/` at build time.

### Netlify Free Tier Limits (300 credits/month)
Each production deploy costs ~15 credits. The free tier allows ~20 deploys/month. **Do not enable scheduled build hooks** — even a 6-hourly hook would consume 2,700 credits/month. Use push-triggered deploys only, plus manual "Trigger deploy" from the Netlify dashboard for content refreshes.

### Tailwind CSS 4
Uses CSS-based configuration (`@import "tailwindcss"`) instead of v3's JS config. Follow whatever `npx sv add tailwindcss` generates.

### CLI Quirks
- `npx sv create` and `npx sv add` require clean git working directory or `--skip-preflight`
- `npx shadcn-svelte init` prompts for lib alias — pass `--lib-alias '$lib'` to skip
- Tailwind CSS 4 setup: install `tailwindcss` + `@tailwindcss/vite`, add plugin to `vite.config.ts`, use `@import 'tailwindcss'` in `app.css`

### Google Fonts via CDN
Bodoni Moda and Raleway load from Google Fonts CDN. Potential FOUC on slow connections. If this becomes a problem, self-host the font files in `static/fonts/`.

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
- **Hardcoded social links:** GitHub (`rlmiller216`) and LinkedIn (`rlmiller216`) are in `+layout.svelte` footer — not env vars

