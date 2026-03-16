# Product Requirements — Rebecca Miller's Personal Website

> MoSCoW tracking for all capabilities. Updated as features ship.

## Must Have (Launch Blockers)

- [ ] **Home page** with hero section, featured projects, tools, resources
- [ ] **About page** rendered from Notion page content
- [ ] **Projects page** with card grid from Notion database
- [ ] **Open Source page** with card grid from Notion database
- [ ] **Resources page** grouped by type from Notion database
- [ ] **Interests section** with 5 sub-pages (Poetry, Art, Music, Travel, Food) from Notion
- [ ] **Contact page** with Formspree form
- [ ] **Responsive design** — mobile, tablet, desktop
- [x] **Scroll-aware responsive navigation** — desktop nav bar + mobile hamburger menu
- [x] **Scroll-collapsing RLM letter sidebar** — R fixed, L+M animate on scroll, responsive md/lg sizing
- [x] **Page header styling** — consistent header treatment across all pages
- [x] **Footer redesign** — updated layout and styling with Raleway RLM branding
- [ ] **Notion as CMS** — all content fetched from Notion API at build time
- [ ] **Static site generation** — adapter-static produces pure HTML
- [ ] **Netlify deployment** — free hosting with build hooks
- [ ] **SEO meta tags** — title, description, Open Graph on all pages
- [ ] **Accessible** — keyboard navigation, semantic HTML, WCAG AA contrast
- [ ] **Error handling** — friendly 404 page + runtime error page
- [ ] **Empty states** — friendly messages when Notion databases have no content

## Should Have (High Value, Not Blockers)

- [ ] **Favicon** — R monogram SVG
- [ ] **robots.txt** — search engine directives
- [ ] **Sitemap** — auto-generated XML sitemap
- [ ] **Hourly rebuilds** — Netlify build hook on schedule for fresh Notion content
- [ ] **Featured items on homepage** — checkbox-driven from Notion databases
- [x] **Design system with custom color palette** — cohesive typography, color, spacing via CSS variables
- [x] **Google Fonts integration (Bodoni Moda + Raleway)** — distinctive typography pairing
- [ ] **Page load animations** — staggered reveals for delight
- [x] **"Scientific Warmth" aesthetic** — distinctive, not generic AI design
- [x] **Card hover animations / micro-interactions** — subtle feedback on interactive elements

## Could Have (Nice Extras)

- [x] **Dark mode support** — toggle with persistent preference
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
