# System Architecture

> **Version**: 1.0
> **Date**: 2026-03-15
> **Status**: Living Document
> **Scope**: Personal website for a scientist — SvelteKit static site powered by Notion CMS

---

## 1. System Overview

### 1.1 Architecture Summary

A **build-time static site** that pulls content from Notion databases and pages at build time, produces static HTML/CSS/JS, and deploys to Netlify. There is no runtime server — all Notion API calls happen during `npm run build`.

```
┌──────────────┐     build time      ┌──────────────┐    deploy     ┌──────────────┐
│              │    ──────────────▶   │              │  ──────────▶  │              │
│  Notion CMS  │   Notion SDK v5     │   SvelteKit  │   static     │   Netlify    │
│  (databases  │   API calls         │   adapter-   │   HTML/CSS   │   CDN        │
│   + pages)   │                     │   static     │   /JS        │              │
│              │    ◀── (one-way) ── │              │              │              │
└──────────────┘                     └──────────────┘              └──────────────┘
       ▲                                                                  │
       │                                                                  │
  Rebecca edits                                                   Visitors see
  content in Notion                                               static HTML
```

**Key constraint:** No runtime server. All dynamic data is resolved at build time and baked into static HTML. Content changes require a rebuild.

### 1.2 Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| CMS | Notion (databases + pages) | Content authoring and management |
| API | @notionhq/client v5 | Fetch content at build time |
| Framework | SvelteKit + adapter-static | Static site generation |
| Language | TypeScript (strict) | Type-safe codebase |
| UI Components | shadcn-svelte | Accessible, styled primitives |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Hosting | Netlify (free tier) | CDN, auto-deploys on push (no scheduled hooks — see §5.6) |
| Forms | Formspree | Contact form (no server needed) |
| Version Control | Git + GitHub (private) | Source code management |
| Testing | Vitest | Unit tests for services |

### 1.3 Codebase Summary

```
Personal Website v0.1.0
├── src/lib/server/services/  ~870 LOC — Notion API client, data fetchers, block transformer, image cache
├── src/lib/components/       ~660 LOC — Cards, NotionBlock renderers, LetterSidebar, ThemeToggle
├── src/lib/types/            ~149 LOC — Domain type definitions
├── src/routes/               ~550 LOC — 9 page routes + layouts + error page
├── src/app.css               ~240 LOC — Design system tokens, typography, animations
├── tests/                  ~1,000 LOC — Vitest unit tests (144 tests across 11 files)
├── docs/                              — Architecture docs + product requirements
└── static/                            — Favicon, robots.txt, 404, Mol* sessions, Netlify headers
```

---

## 2. Domain Model

### 2.1 Content Types

Five content types, each sourced differently from Notion:

| Content Type | Notion Source | Fetch Method | TypeScript Interface |
|---|---|---|---|
| Project | Projects database | `dataSources.query()` → mapper | `Project` |
| Tool | Open Source database | `dataSources.query()` → mapper | `Tool` |
| Resource | Resources database | `dataSources.query()` → mapper | `Resource` |
| About | Single Notion page | `blocks.children.list()` → transformer | `ContentBlock[]` |

### 2.2 Database Schemas

**Projects** (10 properties)
- Title (title), Description (rich_text), Sector (select), Status (select), Role (rich_text), Image (files), URL (url), Featured (checkbox), Order (number), Tags (multi_select)
- **Filters:** Status ≠ "Archived" for `getAllProjects()`, Featured = true AND Status ≠ "Archived" for `getFeaturedProjects()`
- **Sorts:** Order ascending

**Open Source / Tools** (9 properties)
- Title (title), Description (rich_text), Category (select), GitHub URL (url), Demo URL (url), Tags (multi_select), Featured (checkbox), Files & media (files), Order (number)
- **Filters:** Featured = true for `getFeaturedTools()`
- **Sorts:** Order ascending

**Resources** (8 properties)
- Title (title), Type (select), Category (select), Author (rich_text), URL (url), Why I Love It (rich_text), Image (files)
- **Grouping:** `groupByType()` groups by Type property (Book, Website, Podcast, etc.)

### 2.3 Content Rendering Model

Database content (Projects, Tools, Resources) maps to **typed objects** rendered by card components.

Page content (About) maps to **ContentBlock[]** rendered by the NotionBlock component. ContentBlock is a serializable intermediate representation:

```
Notion API Block → ContentBlock → Svelte Component → HTML

BlockObjectResponse    { id, type,      <NotionBlock>     <p>, <h1>,
(SDK type, complex)     richText,       (switch on type)   <ul>, <img>,
                        children,                          <blockquote>
                        url, ... }
```

---

## 3. Data Architecture

### 3.1 Data Flow at Build Time

```
┌───────────────────────────────────────────────────────────────────────┐
│                        npm run build                                  │
│                                                                       │
│  1. SvelteKit calls +page.server.ts load() functions                 │
│  2. Services call Notion API via notion.service.ts                   │
│  3. Database services: queryAllPages() → mapper() → typed objects    │
│  4. Page services: getPageBlocks() → transformBlocks() → ContentBlock│
│  5. Typed data passed to .svelte components via page data            │
│  6. adapter-static renders to HTML files in build/                   │
│                                                                       │
│  Result: build/ contains pure HTML/CSS/JS, no API calls at runtime   │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2 Two Data Paths

| Path | Source | Pipeline | Output |
|---|---|---|---|
| **Database path** | Notion databases (Projects, Tools, Resources) | `dataSources.query()` → property extractors → typed interface | `Project[]`, `Tool[]`, `Resource[]` |
| **Page path** | Notion pages (About) | `blocks.children.list()` → `transformBlocks()` → `groupListItems()` | `ContentBlock[]` |

### 3.3 Environment Variables

All configuration is in `.env` (never committed). `.env.example` documents the contract.

| Variable | Type | Purpose |
|---|---|---|
| `NOTION_API_KEY` | Secret | Notion integration API key |
| `NOTION_PROJECTS_DS_ID` | UUID | Projects data source ID |
| `NOTION_TOOLS_DS_ID` | UUID | Open Source data source ID |
| `NOTION_RESOURCES_DS_ID` | UUID | Resources data source ID |
| `NOTION_ABOUT_PAGE_ID` | UUID | About page ID |
| `RM_SITE_NAME` | String | Site title (used in layout nav + footer) |
| `RM_SITE_TAGLINE` | String | Site tagline (e.g., "Science for Good") |
| `RM_HERO_HEADLINE` | String | Homepage hero headline (e.g., "Science for the Greater Good") — split into lead/bridge/highlight by BRIDGE_WORDS |
| `RM_HERO_INTRO` | String | Homepage hero intro text (e.g., "Building Tools for a Better World") |

**Suffix convention:** `_DS_ID` = Notion v5 data source ID (not `_DB_ID`). `_PAGE_ID` = Notion page ID.

---

## 4. Boundary Contracts

### 4.1 Notion API → Services

**Input:** Raw `PageObjectResponse` and `BlockObjectResponse` from `@notionhq/client` v5.

**Property extraction contract:** Each property extractor checks `property.type` before accessing type-specific fields. Returns safe default (empty string, `0`, `false`, `[]`) for wrong types.

**Pagination contract:** `queryAllPages()` and `getPageBlocks()` loop until `has_more === false`, using `start_cursor` for continuation.

### 4.2 Services → Routes

**Database services** return typed arrays: `Project[]`, `Tool[]`, `Resource[]`.

**Page services** return `ContentBlock[]` — a flat, serializable representation of Notion blocks that carries no references to the Notion SDK.

### 4.3 Routes → Components

**Cards** (future) receive typed props: `project: Project`, `tool: Tool`, etc.

**NotionBlocks** receives `blocks: ContentBlock[]`, iterates and delegates to `NotionBlock`.

**NotionBlock** receives a single `block: ContentBlock` and renders the appropriate HTML based on `block.type`.

---

## 5. Known Limitations & Risks

### 5.1 Notion S3 Files (Cached at Build Time)

Notion-hosted files (type `"file"`) use signed S3 URLs that expire in ~1 hour. At build time, `image-cache.ts` downloads all Notion S3 files: images and videos (mp4/webm/mov) to `static/images/` and other files (PDFs, docs, etc.) to `static/files/`. Both are rewritten to permanent `/{dir}/{hash}.ext` paths. HEIC images (common from iPhone uploads via Notion) are auto-detected by magic bytes and converted to JPEG via `heic-convert`. A shared `downloadS3File()` function handles both paths with a content-type safelist (`image/*`, `video/*`, `application/pdf`, etc. — rejects S3 XML/HTML error pages). The main entry point is `downloadItemMedia()` (renamed from `downloadItemImages`), which processes all media files for a content item. A dedup `Map<pathname, Promise>` prevents concurrent download races during prerender. Failed downloads fall back to the original S3 URL. Post-build `cp -f` copies file contents from `static/images/*` and `static/files/*` to `build/` — uses glob (`*`) instead of `cp -r` to avoid nested directories when Vite's static snapshot already created the target. Both `static/images/` and `static/files/` are gitignored.

### 5.2 Notion SDK v5 Breaking Changes

The Notion SDK v5 removed `databases.query()` and replaced it with `dataSources.query()`. Parameters use `data_source_id` instead of `database_id`. The type `QueryDatabaseParameters` is now `QueryDataSourceParameters`.

**Mitigation:** All API calls use the v5 API. Env vars use `_DS_ID` suffix to reflect this.

### 5.3 Build Time Scales with Content

Every build fetches all content from Notion. Build time grows linearly with content volume. Currently negligible (< 5 seconds), but could matter with hundreds of entries.

**Mitigation:** Notion API pagination (100 per request). If needed: incremental builds or caching layer.

### 5.4 No Runtime Content Updates

Content changes in Notion don't appear until the next build. Visitors see stale content between builds.

**Mitigation:** Push to GitHub triggers a rebuild. For urgent content changes without a code push, use the Netlify dashboard "Trigger deploy" button.

### 5.5 Rate Limits

Notion API rate limit: 3 requests/second per integration. Build-time-only access keeps us well under this for current content volume.

### 5.6 Netlify Free Tier Deploy Limits

Netlify free tier: 300 credits/month. Each production deploy costs ~15 credits, allowing ~20 deploys/month. Scheduled build hooks (e.g., hourly) are not viable — an hourly hook would consume 10,800 credits/month.

**Mitigation:** Push-triggered deploys only. For content refreshes without code changes, use the Netlify dashboard "Trigger deploy" button. Budget deploys carefully during active development.

---

## 6. Static Generation

### 6.1 adapter-static Configuration

```js
// svelte.config.js
adapter: adapter({ pages: 'build', assets: 'build', fallback: '404.html' })
```

- `prerender = true` in root `+layout.ts` — all routes are static
- `fallback: '404.html'` — unknown routes serve the 404 page
- Dynamic routes (`projects/[slug]`, etc.) require `entries()` function returning all valid slugs

### 6.2 Build Output

```
build/
├── index.html          ← /
├── about/index.html    ← /about
├── projects/index.html ← /projects
├── ...
├── 404.html            ← fallback for unknown routes
├── _app/               ← SvelteKit runtime assets
└── robots.txt          ← copied from static/
```

---

## 7. Deployment

### 7.1 Netlify Configuration

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "22"
```

### 7.2 Rebuild Strategy

| Trigger | Method | Frequency |
|---|---|---|
| Git push | Automatic (Netlify watches repo) | On every push |
| Manual | Netlify dashboard "Trigger deploy" | On demand (for content refreshes) |

**⚠️ No scheduled build hooks.** Netlify free tier provides 300 credits/month (~20 deploys at ~15 credits each). A scheduled hook would exhaust the quota in hours. Push-triggered deploys + manual dashboard triggers are sufficient.

---

## 8. Design System

### 8.1 Color Palette

Five-color OKLCH palette mapped to CSS custom properties in `app.css`:

| Token | Name | Role |
|---|---|---|
| `--color-primary` | Ultra Violet | Brand accent, interactive elements |
| `--color-secondary` | White Smoke | Light backgrounds, cards |
| `--color-foreground` | Onyx | Primary text |
| `--color-accent` | Neon Chartreuse | Highlights, CTAs |
| `--color-deep` | Deep Twilight | Dark backgrounds, headers |

Colors use hex values for brand-critical accuracy (OKLCH approximations caused color drift). Tailwind consumes them via `@theme` inline mapping, producing utility classes like `bg-primary`, `text-foreground`, etc.

### 8.2 Typography

| Role | Typeface | Source |
|---|---|---|
| Headings | Bodoni Moda | Google Fonts CDN |
| Body | Raleway | Google Fonts CDN |

Font links are loaded in `app.html` `<head>`. Tailwind `@theme` maps `--font-heading` and `--font-body` to utility classes.

### 8.3 Dark Mode

Light/dark mode uses a `.dark` class on the `<html>` element. CSS custom properties switch values inside a `.dark {}` block in `app.css`, so all components update automatically without per-component logic.

**Persistence:** `localStorage` stores the user's preference. On first visit, `prefers-color-scheme` media query determines the default.

**Flash prevention:** An inline `<script>` in `app.html` runs before paint — reads `localStorage` (or `prefers-color-scheme`) and sets the `.dark` class synchronously, preventing a light-to-dark flash on dark-mode pages.
