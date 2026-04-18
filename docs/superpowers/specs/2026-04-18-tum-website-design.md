# TUM website (tastatur-und-maus.net) — v1 design

- **Date:** 2026-04-18
- **Author:** Reza Esmaili (with Claude Code)
- **Status:** Draft — awaiting user review before implementation plan

## 1. Context

Tastatur und Maus e.V. is the non-profit that organises **Revision**, the world's largest demoparty, every Easter in Saarbrücken. The association needs a public website whose primary business goal is **attracting sponsors for Revision 2027** (April 2–5, 2027 — ~11.5 months out at time of writing), and whose secondary role is serving as the public face of the e.V. for the demoscene community, press, and authorities. The site is bilingual (EN/DE).

A design agency delivered a handoff bundle (`design_handoff_tum_website/`) with three HTML prototypes. **Site A — Editorial** is the approved direction. The prototypes are pixel-accurate references, not production code. This project recreates Site A in a production stack.

## 2. Goals

- Faithfully recreate the Site A Editorial visual design in Astro + Tailwind v4.
- Bilingual EN/DE content authored as Markdown and loaded via Astro content collections.
- Deployed to the existing self-hosted k8s cluster using the same GitOps pattern as `archive.revision-party.net` (Docker Hub image → manifest repo bump → ArgoCD).
- Ship v1 fast. Iterate on content, photography, SEO, a11y, and richer interactions after v1 is live.

## 3. Non-goals for v1 (explicit deferrals to v1.1)

- Real Revision photography — keep the Unsplash placeholder URLs from the handoff.
- SEO polish (OG images, schema.org/Event JSON-LD, hreflang wiring beyond Astro defaults).
- Accessibility audit (keyboard focus pass, ARIA landmarks, skip links).
- Contact form backend (contact section renders `mailto:` links for v1).
- JS-driven animations: IntersectionObserver reveals, stats counter, hero photo parallax.
- Umami analytics hookup.
- Pagefind search.
- Hamburger→JS drawer upgrade (v1 uses a CSS-only drawer).
- Imprint / privacy / code-of-conduct content (empty stub pages with TODO copy).
- Scraper for `tf.weimarnetz.de` photo archive.

All follow-ups tracked in `docs/TODO.md`.

## 4. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Astro v6 | Matches `archive.revision-party.net`. Static output. |
| CSS | Tailwind CSS v4 via `@tailwindcss/vite` | Design tokens live in `@theme {}` in `src/styles/global.css`. No `tailwind.config.js`. |
| Language | TypeScript | `tsconfig.json` mirrors reference repo. |
| Runtime | Node ≥22.12.0 | Build-time only. |
| JS framework integrations | None in v1 | Pure `.astro` components. No Vue/React. |
| Fonts | Self-hosted | `@fontsource/inter-tight`, `@fontsource/jetbrains-mono`; Instrument Serif manually downloaded from Google Fonts into `public/fonts/` + `@font-face` rule. |
| Content | Astro content collections | Zod-typed, Markdown bodies, YAML frontmatter. |
| i18n | Astro built-in i18n routing | `prefixDefaultLocale: true`, defaults `en`. |
| Output | Static | `output: 'static'`. No SSR adapter. |
| Serving | nginx (in Docker) | Same pattern as reference repo. |
| Deploy | GH Actions → Docker Hub → SSH-commit to manifest repo | GitOps. ArgoCD (external to this repo) reconciles. |

## 5. Repo layout

```
/
├── astro.config.mjs
├── package.json
├── package-lock.json
├── tsconfig.json
├── Dockerfile
├── nginx.conf
├── README.md
├── LICENSE
├── .gitignore
├── .github/workflows/
│   └── deploy.yml
├── docs/
│   ├── design-handoff/            # moved from design_handoff_tum_website/
│   ├── superpowers/
│   │   ├── specs/                 # this file
│   │   └── plans/                 # implementation plans
│   └── TODO.md                    # v1.1 follow-ups
├── public/
│   ├── fonts/
│   │   └── instrument-serif-*.woff2
│   ├── tum-logo.png               # from handoff
│   ├── tum-bubble.png             # from handoff
│   └── favicon.*
└── src/
    ├── content/
    │   ├── config.ts              # Zod schemas
    │   ├── home/
    │   │   ├── en/
    │   │   │   ├── 01-hero.md
    │   │   │   ├── 02-ticker.md
    │   │   │   ├── 03-stats.md
    │   │   │   ├── 04-about.md
    │   │   │   ├── 05-revision.md
    │   │   │   ├── 06-history.md
    │   │   │   ├── 07-sponsors-pitch.md
    │   │   │   ├── 08-gallery.md
    │   │   │   ├── 09-press.md
    │   │   │   ├── 10-news.md
    │   │   │   └── 11-contact.md
    │   │   └── de/ …              # mirror
    │   ├── sponsors/
    │   │   ├── en/tiers.md        # frontmatter: 6 tier entries (array)
    │   │   └── de/tiers.md
    │   ├── history/
    │   │   ├── en/items.md        # frontmatter: 6 year items (array)
    │   │   └── de/items.md
    │   └── news/
    │       ├── en/{slug}.md
    │       └── de/{slug}.md
    ├── i18n/
    │   ├── index.ts               # getLocale(url), t(key), route(path, locale)
    │   └── nav.ts                 # nav label dictionary
    ├── layouts/
    │   └── BaseLayout.astro       # <html lang>, meta, fonts, slots
    ├── components/
    │   ├── primitives/
    │   │   ├── Button.astro
    │   │   ├── Kicker.astro
    │   │   ├── PhotoCard.astro
    │   │   └── HeritageBadge.astro
    │   ├── TopBar.astro           # nav + lang toggle + sponsor CTA + hamburger
    │   ├── Footer.astro
    │   └── sections/
    │       ├── Hero.astro
    │       ├── TickerStrip.astro
    │       ├── StatsGrid.astro
    │       ├── AboutSection.astro
    │       ├── RevisionSection.astro
    │       ├── HistoryTimeline.astro
    │       ├── SponsorsPitch.astro
    │       ├── SponsorTiers.astro
    │       ├── SponsorWall.astro
    │       ├── Gallery.astro
    │       ├── PressKit.astro
    │       ├── News.astro
    │       └── ContactSection.astro
    ├── pages/
    │   ├── index.astro            # placeholder; Accept-Language handled by nginx
    │   ├── en/
    │   │   ├── index.astro
    │   │   ├── imprint.astro
    │   │   ├── privacy.astro
    │   │   └── code-of-conduct.astro
    │   ├── de/
    │   │   ├── index.astro
    │   │   ├── imprint.astro
    │   │   ├── privacy.astro
    │   │   └── code-of-conduct.astro
    │   └── 404.astro
    └── styles/
        └── global.css
```

## 6. Content model

Astro content collections, one entry per section per locale. `src/content/config.ts` defines Zod schemas; the build fails loudly if frontmatter drifts.

**Pattern for section entries (`home/{lang}/NN-name.md`):**

```yaml
---
order: 1                     # numeric ordering within the page
section: "hero"              # stable id for layout lookup
# ...section-specific frontmatter (headline, subtitle, CTAs, etc.)
---

Optional longer prose body in Markdown.
```

**Pattern for structured list collections (`sponsors/{lang}/tiers.md`):**

```yaml
---
tiers:
  - name: "Private Supporter"
    price: "individual"
    perks: ["Name on supporter wall", …]
  - name: "Gold"
    price: "from € 5,000"
    perks: […]
    highlight: true
---
```

The root home page (`pages/{lang}/index.astro`) loads all `home/{lang}/*.md` entries, sorts by `order`, and renders each via a dispatcher that maps `section` → section component.

**Content migration:** the EN and DE strings in `design_handoff_tum_website/assets/content.js` are the source of truth for v1 copy. Implementation plan will include a one-shot migration script (or manual copy) from that JS object into the MD files.

## 7. i18n

```js
// astro.config.mjs
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'de'],
  routing: { prefixDefaultLocale: true },
}
```

- Both locales live under URL prefix: `/en/…` and `/de/…`.
- Language switch in TopBar is a real link that swaps the prefix, not JS state or localStorage.
- `src/i18n/index.ts` exposes:
  - `getLocale(url: URL): 'en' | 'de'`
  - `t(dict, key)` for small dictionaries (nav labels, aria-labels, button text that isn't in the content MD)
  - `route(path, locale)` for constructing language-swapped URLs
- Astro generates `<link rel="alternate" hreflang="en" href="…">` pairs via its i18n helpers in `BaseLayout`.

## 8. Accept-Language redirect (nginx)

The site is pure static HTML served by nginx. Astro output has no `/` page (both locales are prefixed), so nginx handles the root redirect based on the browser's `Accept-Language` header. Decision: **option A (nginx map)**, rejecting client-side JS to avoid the flash and to keep the redirect cacheable.

The `nginx:alpine` base image includes `/etc/nginx/conf.d/*.conf` inside its top-level `http {}` block, so our `nginx.conf` (copied to `/etc/nginx/conf.d/default.conf` by the Dockerfile) can declare `map` directives at the file top, outside the `server {}` block:

```nginx
map $http_accept_language $tum_pref_lang {
  default          en;
  ~*^de            de;     # starts with de / de-DE / de-AT / de-CH
  ~*[,;\s]de       de;     # de appears after the first preference
}

server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Language-aware root redirect (only affects "/")
  location = / {
    add_header Vary "Accept-Language" always;
    return 302 /$tum_pref_lang/;
  }

  # …remainder of server block (try_files, cache headers, security headers)…
}
```

Notes:
- `302` (not `301`) so users and caches respect a future default change.
- `Vary: Accept-Language` lets the CDN/browser cache the redirect per language group.
- `/` remains the only Accept-Language-sensitive URL; every other path is prefix-explicit.
- Astro does not emit a root `/index.html` when `prefixDefaultLocale: true`, so nginx's `try_files` fallback on `/` would 404 without this block. Both safeguards coexist.

## 9. Styling — Tailwind v4 tokens

All design tokens from README §Design Tokens become CSS custom properties inside `@theme {}` in `src/styles/global.css`, which Tailwind v4 turns into utilities automatically (`bg-paper`, `text-ink`, `font-display`, `text-red`, etc.):

```css
@import "tailwindcss";
@import "@fontsource/inter-tight/400.css";
@import "@fontsource/inter-tight/500.css";
@import "@fontsource/inter-tight/600.css";
@import "@fontsource/inter-tight/700.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

@font-face {
  font-family: 'Instrument Serif';
  src: url('/fonts/instrument-serif-regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'Instrument Serif';
  src: url('/fonts/instrument-serif-italic.woff2') format('woff2');
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

@theme {
  --color-paper: #f4f4f2;
  --color-paper-2: #e9e9e6;
  --color-ink: #14131a;
  --color-ink-2: #3a3843;
  --color-muted: #7a7680;
  --color-rule: #d2d2cc;
  --color-red: #c8203a;
  --color-red-ink: #8e0f22;
  --color-stream: #3b4f7a;
  --color-ok: #2f6e4a;

  --font-display: "Instrument Serif", "Times New Roman", serif;
  --font-sans: "Inter Tight", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

**Typography reconciliation:** README §Design Tokens names Outfit as the display font, but Site A's CSS uses Instrument Serif. The CSS is the rendered truth (confirmed visually in the prototype). v1 uses **Instrument Serif**.

Section-specific numeric values from the prototype CSS (fluid clamp() sizes, custom gradients, shadow values) stay as inline Tailwind arbitrary values or small scoped `<style>` blocks inside the section components — not promoted to tokens unless used in ≥2 places.

## 10. Components

One `.astro` component per section listed in README §Screens; all component props are typed and pulled from content collections at build time. Zero hardcoded copy in components.

**Primitives:** `Button` (primary/ghost/small variants), `Kicker` (mono eyebrow label with leading rule), `PhotoCard` (background-image card with caption + optional heritage-badge slot), `HeritageBadge`.

**Chrome:** `TopBar` (logo, nav, lang toggle, sponsor CTA, hamburger), `Footer`.

**Sections:** `Hero`, `TickerStrip`, `StatsGrid`, `AboutSection`, `RevisionSection`, `HistoryTimeline`, `SponsorsPitch`, `SponsorTiers`, `SponsorWall`, `Gallery`, `PressKit`, `News`, `ContactSection`.

The home page uses a **section dispatcher**: iterate over the sorted `home/{lang}/*` collection entries, switch on `section` id, render the matching component. Keeps `pages/{lang}/index.astro` short and order-from-content.

## 11. Animations in v1

Keep (CSS-only):
- Pulsing red hero dot (`@keyframes pulse`).
- Marquee ticker strip (60s linear loop).
- Hover states (nav link red color, history timeline red bar slide-in, press-kit row indent, photo card subtle scale).

Drop from v1 (add to v1.1):
- IntersectionObserver scroll-reveal on `.reveal` elements.
- Stats counter animating 0→target over 1.4s.
- Hero photo parallax on scroll.

Gate all animations behind `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }` in `global.css`.

## 12. Mobile navigation

Below 980px the desktop nav is replaced by a CSS-only drawer driven by a hidden checkbox (`input:checked ~ .drawer`). Renders a full-height overlay with nav links, language toggle, and the sponsor CTA. No JS. When the drawer needs more behavior (focus trap, aria-expanded sync) we replace with a small JS component in v1.1.

## 13. Deployment

### 13.1 Dockerfile (pattern from reference repo)

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### 13.2 GH Actions (`.github/workflows/deploy.yml`)

Mirrors `archive.revision-party.net/.github/workflows/deploy.yml`. Differences:

- Docker image: `dfox288/tastatur-und-maus:${SHA}` and `…:latest`.
- Manifest repo: `git@github.com:dfox288/tum-cluster-tum-websites_k8s.git` (NOT the revision-websites repo).
- Bump target: `sed -i "s|dfox288/tastatur-und-maus:.*|dfox288/tastatur-und-maus:${SHA}|" tastatur-und-maus.net/*-deployment.yaml` (exact file path to be confirmed against the target repo; the plan will validate this).
- Deploy key secret: reuse `TUM_REVISION_K8S_PRIVATE_KEY` if it has write access to `tum-cluster-tum-websites_k8s`, else add a new secret `TUM_WEBSITES_K8S_PRIVATE_KEY`.

### 13.3 nginx.conf

Same skeleton as reference repo (`try_files`, cache headers for assets, 30d for static, 1h for HTML, security headers, block dotfiles), plus the Accept-Language redirect block from §8.

### 13.4 Blocking external work (user-owned, flagged in plan)

Before the first deploy can succeed:
1. Create a folder `tastatur-und-maus.net/` in `dfox288/tum-cluster-tum-websites_k8s` with a Deployment, Service, and Ingress manifest for the new image.
2. Configure DNS for `tastatur-und-maus.net` to hit the cluster ingress.
3. Ensure cert-manager / TLS issuer covers the new host.
4. Add `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, and the k8s deploy SSH key as GH Actions secrets on this repo.

## 14. v1.1 follow-ups (to `docs/TODO.md`)

- Replace Unsplash placeholders with real Revision photography (from tf.weimarnetz.de or own archive); add responsive `<picture>` with WebP/AVIF; optimize at build.
- JS-driven animations: IntersectionObserver reveal, stats counter, hero photo parallax — all behind `prefers-reduced-motion`.
- Upgrade hamburger from CSS drawer to JS drawer (focus trap, aria-expanded, escape-to-close).
- Contact form (Formspree / Web3Forms / self-hosted).
- Umami analytics (`analytics.tastatur-und-maus.net`).
- OG images per page + Twitter card meta.
- schema.org/Event JSON-LD for Revision.
- hreflang alternates verified in SERP.
- a11y audit: skip link, focus-visible styles, ARIA landmarks, color contrast check.
- Pagefind search if content volume justifies it.
- Imprint, privacy, code of conduct content (real copy, bilingual).
- `scripts/fetch-photos.mjs` scraper for tf.weimarnetz.de with attribution manifest.

## 15. Open questions / assumptions

- **Assumption:** Astro 6's `prefixDefaultLocale: true` plus a nginx root redirect produces no double-redirect or /en/ canonical issues. Plan will include a test.
- **Assumption:** The `tum-cluster-tum-websites_k8s` repo exists and is the correct manifest repo (confirmed by user 2026-04-18).
- **Assumption:** The existing `TUM_REVISION_K8S_PRIVATE_KEY` secret has write access to both manifest repos, OR a new secret is needed. The implementation plan will verify by attempting a push; if it fails, we surface a clear action item.
- **Open:** Exact k8s Deployment manifest filename inside the `tum-cluster-tum-websites_k8s/tastatur-und-maus.net/` folder (drives the `sed` target). Confirmed at plan time by reading the repo.
- **Assumption:** The design handoff copy in EN and DE is production-ready and doesn't need legal/editorial review before v1 launch. If it does, it's a separate content workstream.
