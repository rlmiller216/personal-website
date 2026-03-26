# Product Requirements — Rebecca Miller's Personal Website

> MoSCoW tracking for all capabilities. Updated as features ship.

## Must Have (Launch Blockers)

- [ ] **Home page** with hero section, featured projects, tools, resources
- [ ] **About page** rendered from Notion page content
- [ ] **Projects page** with card grid from Notion database
- [ ] **Open Source page** with card grid from Notion database
- [ ] **Resources page** grouped by type from Notion database
- [x] ~~**Interests section**~~ — Removed (2026-03-16). Interests content will be added to About page later
- [ ] **Contact page** with Formspree form
- [ ] **Responsive design** — mobile, tablet, desktop
- [x] **Scroll-aware responsive navigation** — desktop nav bar + mobile hamburger menu
- [x] **Scroll-collapsing RLM letter sidebar** — R fixed, L+M animate on scroll, responsive md/lg sizing
- [x] **Page header styling** — consistent header treatment across all pages
- [x] **Footer redesign** — updated layout and styling with Plus Jakarta Sans RLM branding
- [ ] **Notion as CMS** — all content fetched from Notion API at build time
- [ ] **Static site generation** — adapter-static produces pure HTML
- [ ] **Netlify deployment** — free hosting, auto-deploys on push
- [ ] **SEO meta tags** — title, description, Open Graph on all pages
- [ ] **Accessible** — keyboard navigation, semantic HTML, WCAG AA contrast
- [ ] **Error handling** — friendly 404 page + runtime error page
- [ ] **Empty states** — friendly messages when Notion databases have no content

## Should Have (High Value, Not Blockers)

- [ ] **Favicon** — R monogram SVG
- [ ] **robots.txt** — search engine directives
- [ ] **Sitemap** — auto-generated XML sitemap
- [x] ~~**Hourly rebuilds**~~ — Not viable on free tier (300 credits/month, ~15/deploy). Using push-triggered + manual dashboard deploys instead
- [ ] **Featured items on homepage** — checkbox-driven from Notion databases
- [x] **Design system with custom color palette** — cohesive typography, color, spacing via CSS variables
- [x] **Google Fonts integration (Bodoni Moda + Plus Jakarta Sans)** — distinctive typography pairing
- [ ] **Page load animations** — staggered reveals for delight
- [x] **"Scientific Warmth" aesthetic** — distinctive, not generic AI design
- [x] **Card hover animations / micro-interactions** — subtle feedback on interactive elements

- [x] **Caption-based image width control** — type `[w:50]` at the start of any image caption in Notion to render it at 50% width (or any 1–100%); hint is stripped from display. Default = full width.

## Could Have (Nice Extras)

- [x] **Dark mode support** — toggle with persistent preference
- [x] **MCA-style sticky section headers** — homepage sections stick below nav, shadow on stuck, varied card layouts per section (feature card, list items, card grid)
- [ ] **Resource filtering** by type/category
- [ ] **Project filtering** by sector/status
- [ ] **Lighthouse 90+** all categories
- [ ] **Image optimization** — download Notion images at build time for reliability

## Won't Have (Explicitly Out of Scope)

- Blog (could add later)
- User accounts / authentication
- Server-side rendering (static only)
- Custom admin panel (Notion IS the CMS)
- Comments / social features
- Analytics (can add later via Netlify Analytics or Plausible)
- E-commerce / payments
- Newsletter signup (can add later)
