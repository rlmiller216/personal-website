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
| Framework | SvelteKit + adapter-static | Static output, full-stack DX, /design prototypes = production code |
| Styling | Tailwind CSS 4 + shadcn-svelte | CSS-based config, accessible components out of the box |
| CMS | Notion API (@notionhq/client) | Rebecca already uses Notion daily. Edit there → site rebuilds |
| Hosting | Netlify (free tier) | Static hosting, hourly build hooks for fresh Notion content |
| Contact Form | Formspree | adapter-static can't do server-side form handling |
| Icons | Lucide | Standard per Development Bible |

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

**Notion blocks → Svelte components** (NOT `{@html}` strings). Server transforms API blocks into serializable `ContentBlock[]`, then `<NotionBlocks>` renders them as styled Svelte components. This enables per-block Tailwind styling and eliminates XSS risk.

## Project Structure

```
src/
  lib/
    components/
      ui/                   → shadcn-svelte (auto-generated, don't edit)
      ProjectCard.svelte    → Project display card
      ToolCard.svelte       → Open source tool card
      ResourceCard.svelte   → Resource card
      NotionBlocks.svelte   → Renders ContentBlock[] as Svelte components
      NotionBlock.svelte    → Individual block type dispatcher
    server/
      services/
        notion.service.ts   → Notion client + generic fetcher + property extractors
        projects.service.ts → Project mapper + queries
        tools.service.ts    → Tool mapper + queries
        resources.service.ts→ Resource mapper + queries
        interests.service.ts→ Interest page fetcher
        about.service.ts    → About page fetcher
        notion-blocks.ts    → transformBlocks() — Notion API → ContentBlock[]
    types/
      content.ts            → Project, Tool, Resource, ContentBlock interfaces
  routes/
    +layout.svelte          → Shared nav + footer + SEO meta
    +layout.server.ts       → Site metadata from env vars
    +layout.ts              → export const prerender = true
    +page.svelte            → Home page
    +page.server.ts         → Load featured items
    about/
    projects/
    open-source/
    resources/
    interests/[slug]/       → entries() required for adapter-static
    contact/
    +error.svelte           → Runtime error page
static/
  favicon.svg
  robots.txt
  404.html                  → Static 404 fallback (adapter-static)
tests/
  services/
    notion.service.test.ts
    notion-blocks.test.ts
```

## Site Structure

| Page | Route | Content Source |
|------|-------|---------------|
| Home | `/` | Featured items from all DBs |
| About | `/about` | Single Notion page |
| Projects | `/projects` | Notion database |
| Open Source | `/open-source` | Notion database |
| Resources | `/resources` | Notion database |
| Interests | `/interests/[slug]` | Notion pages (Poetry, Art, Music, Travel, Food) |
| Contact | `/contact` | Formspree form |

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

### Interests (Notion Pages)
One page per interest: Poetry, Art, Music, Travel, Food. Parent "Interests" page contains child pages.

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
NOTION_INTERESTS_PAGE_ID=...
NOTION_ABOUT_PAGE_ID=...

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

## Tests

- 44 tests across 2 files: `notion.service.test.ts` (28) + `notion-blocks.test.ts` (16)
- Includes undefined-property guard tests (prevents crashes when Notion DB schema changes)
- Mock Notion SDK responses — no live API calls in tests
- Run: `npx vitest run`

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
- Every module logs its name: `[notion]`, `[projects]`, `[interests]`
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

## Known Limitations & Mitigations

### Notion Image URLs Expire (~1 hour)
Signed S3 URLs expire. Hourly Netlify build hook rebuilds keep them fresh. If we add longer cache times later, we'll download images to `static/` at build time.

### Tailwind CSS 4
Uses CSS-based configuration (`@import "tailwindcss"`) instead of v3's JS config. Follow whatever `npx sv add tailwindcss` generates.

### CLI Quirks
- `npx sv create` and `npx sv add` require clean git working directory or `--skip-preflight`
- `npx shadcn-svelte init` prompts for lib alias — pass `--lib-alias '$lib'` to skip
- Tailwind CSS 4 setup: install `tailwindcss` + `@tailwindcss/vite`, add plugin to `vite.config.ts`, use `@import 'tailwindcss'` in `app.css`

### adapter-static Dynamic Routes
`interests/[slug]/+page.server.ts` must export `entries()` returning all valid slugs from Notion. Required for pre-rendering dynamic routes.

## Notion Page IDs (for reference)

- Parent page: `324e5dbc-4add-81eb-a723-de691193f81b`
- Interests parent: `324e5dbc-4add-8174-838f-d8c9451bb497`
- Interest slugs: poetry, art, music, travel, food

## Design Pipeline

For UI feature development, use these skills in order:

1. `/spec` — Interview the user, research the domain, produce a structured Design Spec
2. `/logic` — Resolve non-visual decisions (policies, flows, states) with evidence-based research
3. `/design` — Generate working Svelte 5 prototype variants, let the user pick winners, iterate

Session artifacts are stored in `~/memory/sessions/`.

## Design Philosophy

1. **"Your website is a party"** — Welcome visitors, guide them, make them feel oriented
2. **"If everything is bold, nothing is bold"** — Use contrast and visual hierarchy
3. **"Illuminate the path"** — Direct, active language. Clear calls to action
4. **"Minimize the non-essential"** — Every element must earn its place
5. **"Squint test"** — Whatever stands out when you squint should be the most important thing
6. **"First impression = seconds"** — Hero section is the most critical design decision

**Aesthetic:** "Scientific Warmth" — precision of academic work + warmth of a whole person.

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts, Space Grotesk)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics.
</frontend_aesthetics>

## Content Workflow

1. Rebecca edits content in Notion (databases + pages)
2. Netlify build hook triggers (hourly, or manual via Netlify dashboard)
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
- **Redeploy:** Push to GitHub, or trigger manually in Netlify dashboard

### Property Extractors Accept `undefined`
All property extractors (`getTitle`, `getRichText`, etc.) accept `PageProperty | undefined`. This prevents crashes when a Notion database doesn't have an expected property name. Tested with 8 dedicated undefined-guard tests.
