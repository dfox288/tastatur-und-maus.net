# TUM website (tastatur-und-maus.net) — v1 design

- **Date:** 2026-04-18
- **Author:** Reza Esmaili (with Claude Code)
- **Status:** Draft — awaiting user review before implementation plan
- **Revision:** 2 (incorporates independent review)

## 1. Context

Tastatur und Maus e.V. is the non-profit that organises **Revision**, the world's largest demoparty, every Easter in Saarbrücken. The association needs a public website whose primary business goal is **attracting sponsors for Revision 2027** (April 2–5, 2027 — ~11.5 months out at time of writing), and whose secondary role is serving as the public face of the e.V. for the demoscene community, press, and authorities. The site is bilingual (EN/DE).

A design agency delivered a handoff bundle (`design_handoff_tum_website/`) with three HTML prototypes. **Site A — Editorial** is the approved direction. The prototypes are pixel-accurate references, not production code. This project recreates Site A in a production stack.

## 2. Goals

- Faithfully recreate the Site A Editorial visual design in Astro + Tailwind v4.
- Bilingual EN/DE content authored as Markdown and loaded via Astro content collections.
- Deployed to the existing self-hosted k8s cluster using the same GitOps pattern as `archive.revision-party.net` (Docker Hub image → manifest repo bump → ArgoCD).
- Ship v1 fast. Iterate on content, photography, SEO, a11y, and richer interactions after v1 is live.

## 3. Non-goals for v1 (explicit deferrals to v1.1)

- Real Revision photography. v1 ships with the Unsplash placeholder images from the handoff, **downloaded at build time into `public/images/`** (no runtime third-party requests — see §13.5).
- SEO polish (OG images per page, schema.org/Event JSON-LD). Baseline SEO (sitemap.xml, robots.txt, hreflang alternates) is in-scope for v1 — see §13.5.
- Accessibility audit (keyboard focus pass, ARIA landmarks, skip links).
- Contact form backend (contact section renders `mailto:` links for v1 — the addresses appear on the imprint page anyway under German law).
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
| Fonts | Self-hosted via `@fontsource` packages | `@fontsource/inter-tight`, `@fontsource/jetbrains-mono`, `@fontsource/instrument-serif`. Vite bundles the woff2 files into `dist/_astro/` with content hashes — no manual `@font-face`, no runtime fetches to Google Fonts. |
| Content | Astro content collections | Zod-typed with `z.discriminatedUnion` per-section schemas. Markdown bodies, YAML frontmatter. |
| i18n | Astro built-in i18n routing | `prefixDefaultLocale: true`, default `en`. |
| Sitemap | `@astrojs/sitemap` | Emits bilingual sitemap with hreflang. |
| Output | Static | `output: 'static'`. No SSR adapter. |
| Serving | nginx (in Docker) | Pattern mirrored from reference repo with additions for Accept-Language redirect. |
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
│   ├── images/                    # Unsplash placeholders downloaded at build time
│   │   ├── hero.jpg               # gets replaced with real Revision photos in v1.1
│   │   ├── gallery-01.jpg … gallery-06.jpg
│   │   └── LICENSES.txt           # Unsplash attribution manifest
│   ├── tum-logo.png               # from handoff
│   ├── tum-bubble.png             # from handoff
│   ├── favicon.*
│   └── robots.txt
├── scripts/
│   ├── fetch-unsplash.mjs         # one-shot: downloads 7 placeholder images to public/images/
│   └── migrate-content.mjs        # one-shot: converts design_handoff_tum_website/assets/content.js → MD files
└── src/
    ├── content/
    │   ├── config.ts              # Zod discriminated unions per section
    │   ├── home/                  # sections of the landing page
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
    │   │   ├── en/tiers.md        # frontmatter: 6 tier entries
    │   │   └── de/tiers.md
    │   ├── history/
    │   │   ├── en/items.md        # frontmatter: 6 year items
    │   │   └── de/items.md
    │   └── news/
    │       ├── en/{slug}.md
    │       └── de/{slug}.md
    ├── i18n/
    │   ├── index.ts               # getLocale(url), t(key), route(path, locale), hreflangPairs()
    │   └── nav.ts                 # nav label dictionary
    ├── layouts/
    │   └── BaseLayout.astro       # <html lang>, meta, fonts, hreflang, slots
    ├── components/
    │   ├── primitives/
    │   │   ├── Button.astro
    │   │   ├── Kicker.astro
    │   │   ├── PhotoCard.astro
    │   │   └── HeritageBadge.astro
    │   ├── TopBar.astro           # nav + lang toggle + sponsor CTA + hamburger
    │   ├── Footer.astro
    │   └── sections/
    │       ├── Hero.astro         # includes inline countdown <script>
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
    │   └── 404.astro              # bilingual (see §13.6)
    └── styles/
        └── global.css
```

**No `src/pages/index.astro`** — the bare root `/` is handled by nginx's `location = /` block (see §8). This is deliberate; don't create it.

## 6. Content model

Single Astro content collection per "shape of data", with Zod discriminated unions where sections vary:

```ts
// src/content/config.ts (abbreviated)
import { defineCollection, z } from 'astro:content';

const hero = z.object({
  section: z.literal('hero'), order: z.number(),
  eyebrow: z.string(), headline: z.string(), headlineAccent: z.string(),
  subtitle: z.string(),
  cta1: z.string(), cta2: z.string(),
  countdownLabel: z.string(),
  heroTag: z.string(), heroCaption: z.string(),
});

const stats = z.object({
  section: z.literal('stats'), order: z.number(),
  items: z.array(z.object({ value: z.string(), label: z.string() })).length(4),
});

// … one schema per section (ticker, about, revision, history,
//    sponsorsPitch, gallery, press, news, contact) …

export const collections = {
  home: defineCollection({
    type: 'content',
    schema: z.discriminatedUnion('section', [hero, stats, /*…*/]),
  }),
  sponsors: defineCollection({ type: 'data', schema: /* tiers array */ }),
  history:  defineCollection({ type: 'data', schema: /* year items array */ }),
  news:     defineCollection({ type: 'content', schema: /* article */ }),
};
```

**Dispatcher** in `pages/{lang}/index.astro`:

```astro
---
const entries = (await getCollection('home', e => e.id.startsWith(`${lang}/`)))
  .sort((a, b) => a.data.order - b.data.order);
---
{entries.map(e => {
  switch (e.data.section) {
    case 'hero':  return <Hero {...e.data} />;
    case 'stats': return <StatsGrid {...e.data} />;
    /* …one case per section; discriminated-union narrows types per branch… */
  }
})}
```

**Content migration** is a committed decision: `scripts/migrate-content.mjs` reads `design_handoff_tum_website/assets/content.js`, writes 22 home-section MD files (11 × 2 locales) + tier/history/news data, then exits. Script is committed alongside its output; can be re-run if the handoff copy changes. Prevents hand-copy errors on a tedious task.

## 7. i18n

```js
// astro.config.mjs
i18n: {
  defaultLocale: 'en',
  locales: ['en', 'de'],
  routing: { prefixDefaultLocale: true },
}
```

- Both locales live under URL prefix: `/en/…` and `/de/…`. Astro **does not** emit a page at `/` with this config unless `src/pages/index.astro` exists; we deliberately don't create one (nginx handles `/`).
- Language switch in TopBar is a real link that swaps the prefix, not JS state or localStorage.
- `src/i18n/index.ts` exposes:
  - `getLocale(url: URL): 'en' | 'de'`
  - `t(dict, key)` for small dictionaries (nav labels, aria-labels, button text that isn't in the content MD)
  - `route(path, locale)` for constructing language-swapped URLs
  - `hreflangPairs(path)` for emitting `<link rel="alternate" hreflang="…">` in `BaseLayout` — this helper is written by hand (Astro 6 exposes `getAbsoluteLocaleUrl`/`getRelativeLocaleUrlList` but not an auto-emit for hreflang tags).
- `@astrojs/sitemap` emits a bilingual sitemap with hreflang (see §13.5).

## 8. Accept-Language redirect (nginx)

The site is pure static HTML served by nginx. With `prefixDefaultLocale: true` and no `src/pages/index.astro`, there is no `dist/index.html`, so nginx handles `/` directly.

The `nginx:alpine` base image includes `/etc/nginx/conf.d/*.conf` inside its top-level `http {}` block, so our `nginx.conf` (copied to `/etc/nginx/conf.d/default.conf` by the Dockerfile) can declare `map` directives at the file top:

```nginx
# Pick DE only when the browser's PRIMARY preference is German. "Presence-of-de
# with any q-weight" would false-match e.g. "fr;q=1.0, de;q=0.01" — we reject
# that and return EN. Proper q-weight parsing requires a real parser (not
# possible in nginx map), so this is a deliberate simplification.
map $http_accept_language $tum_pref_lang {
  default                en;
  ~*^de(-|,|;|$)         de;   # matches bare "de", "de-DE", "de-AT", "de-CH", "de;q=1.0"
}

server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Language-aware root redirect (only affects exactly "/")
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
- `/` is the only Accept-Language-sensitive URL; every other path is prefix-explicit.
- The regex only matches when German is the first listed language in the header, which is what browsers send when German is the user's primary locale. Users with mixed preferences default to EN.

## 9. Styling — Tailwind v4 tokens

All design tokens from the handoff README become CSS custom properties inside `@theme {}` in `src/styles/global.css`, which Tailwind v4 turns into utilities automatically (`bg-paper`, `text-ink`, `font-display`, `text-red`, etc.). All font files ship via `@fontsource` packages — Vite bundles them into `dist/_astro/` with content-hashed filenames (so aggressive immutable caching is safe):

```css
@import "tailwindcss";

/* Body */
@import "@fontsource/inter-tight/400.css";
@import "@fontsource/inter-tight/500.css";
@import "@fontsource/inter-tight/600.css";
@import "@fontsource/inter-tight/700.css";

/* Mono / labels */
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/500.css";

/* Display */
@import "@fontsource/instrument-serif/400.css";
@import "@fontsource/instrument-serif/400-italic.css";

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

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```

**Typography reconciliation:** README §Design Tokens names Outfit as the display font, but Site A's CSS (verified via grep at `design_handoff_tum_website/site-a-editorial.html:25`) sets `--font-display: "Instrument Serif"`. Outfit is only available as a body-class typography-pair swap in the prototype. v1 uses **Instrument Serif**.

**Caching posture:** `@fontsource` woff2 files are processed by Vite, emitted into `dist/_astro/*.woff2` with content hashes — safe to cache `immutable` for a year. Any unhashed files in `public/` (favicons, placeholder images) get `expires 30d` per the reference repo's `nginx.conf`; documented so future additions don't silently cache forever.

Section-specific numeric values from the prototype CSS (fluid `clamp()` sizes, custom gradients, shadow values) stay as inline Tailwind arbitrary values or small scoped `<style>` blocks inside the section components — not promoted to tokens unless used in ≥2 places.

## 10. Components

One `.astro` component per section listed in the handoff README §Screens; all component props are typed by the discriminated-union schema and pulled from content collections at build time. Zero hardcoded copy in components.

**Primitives:** `Button` (primary/ghost/small variants), `Kicker` (mono eyebrow label with leading rule), `PhotoCard` (background-image card with caption + optional heritage-badge slot), `HeritageBadge`.

**Chrome:**
- `TopBar` — logo, nav, lang toggle (real anchor swapping `/en/` ↔ `/de/`), sponsor CTA, hamburger. Uses `backdrop-filter: blur(8px)` with `-webkit-backdrop-filter` fallback for Safari/iOS. Border-bottom toggles on scroll via a 10-line inline `<script>` (same pragmatic exception as the countdown — see below).
- `Footer` — paper background, mono text, copyright + Imprint/Privacy/Code-of-Conduct links.

**Sections:** `Hero`, `TickerStrip`, `StatsGrid`, `AboutSection`, `RevisionSection`, `HistoryTimeline`, `SponsorsPitch`, `SponsorTiers`, `SponsorWall`, `Gallery`, `PressKit`, `News`, `ContactSection`.

**Hero countdown:** 3-line inline `<script>` computes days remaining to `2027-04-02T00:00:00+02:00` (Saarbrücken CEST) at page load and writes the number into the `.days` element. Always accurate, no rebuild dependency. Exempt from the "no JS in v1" posture on the same grounds as the TopBar scroll script and CSS drawer — small, isolated, self-contained.

## 11. Animations in v1

Keep (CSS-only):
- Pulsing red hero dot (`@keyframes pulse`).
- Marquee ticker strip (60s linear loop).
- Hover states (nav link red color, history timeline red bar slide-in, press-kit row indent, photo card subtle scale).

Drop from v1 (add to v1.1):
- IntersectionObserver scroll-reveal on `.reveal` elements.
- Stats counter animating 0→target over 1.4s.
- Hero photo parallax on scroll.

All animations and transitions sit under a global `@media (prefers-reduced-motion: reduce)` disable rule in `global.css` (shown in §9).

## 12. Mobile navigation

Below 980px the desktop nav is replaced by a CSS-only drawer driven by a hidden checkbox (`input:checked ~ .drawer`). Renders a full-height overlay with nav links, language toggle, and the sponsor CTA. No JS. When the drawer needs more behavior (focus trap, aria-expanded sync, escape-to-close) we replace with a small JS component in v1.1.

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

Structurally mirrors `archive.revision-party.net/.github/workflows/deploy.yml`. Differences:

- Docker image: `dfox288/tastatur-und-maus:${SHA}` and `…:latest`.
- Manifest repo: `git@github.com:dfox288/tum-cluster-tum-websites_k8s.git` (a different repo than the revision-websites cluster).
- Bump target: `sed -i "s|dfox288/tastatur-und-maus:.*|dfox288/tastatur-und-maus:${SHA}|" tastatur-und-maus.net/*-deployment.yaml` (exact file path confirmed at plan time by reading the manifest repo).
- **New deploy key + new GH secret** `TUM_WEBSITES_K8S_PRIVATE_KEY`. GitHub deploy keys are repo-scoped, so the existing `TUM_REVISION_K8S_PRIVATE_KEY` cannot be reused on `tum-cluster-tum-websites_k8s`. Generate a new ed25519 key, add the public half as a deploy key (with write access) on the manifest repo, store the private half as this repo's secret.

### 13.3 nginx.conf

New file modeled on the reference repo's `nginx.conf` (cache headers on `*.{js,css,png,jpg,…,woff,woff2}` — `expires 30d; Cache-Control public, immutable`; 1h HTML; security headers: `X-Frame-Options SAMEORIGIN`, `X-Content-Type-Options nosniff`, `X-XSS-Protection 1; mode=block`; dotfile block except `.well-known`; `try_files $uri $uri/ $uri/index.html =404`; custom `error_page 404 /404.html`), **plus** the `map $http_accept_language` block and `location = /` redirect from §8.

### 13.4 Blocking external work (user-owned, flagged in plan)

Before the first deploy can succeed:
1. Create a folder `tastatur-und-maus.net/` in `dfox288/tum-cluster-tum-websites_k8s` with a Deployment, Service, and Ingress manifest for the new image.
2. Configure DNS for `tastatur-und-maus.net` to hit the cluster ingress.
3. Ensure cert-manager / TLS issuer covers the new host.
4. Generate an ed25519 deploy key, register the public half on `tum-cluster-tum-websites_k8s` (write access), store the private half.
5. Add GH Actions secrets on this repo: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `TUM_WEBSITES_K8S_PRIVATE_KEY`.

### 13.5 SEO baseline (in-scope for v1)

- **`@astrojs/sitemap` integration.** Emits `/sitemap-index.xml` + `/sitemap-0.xml` at build, including both `/en/` and `/de/` URLs with `<xhtml:link rel="alternate" hreflang="…">` annotations. Configure via `sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en-US', de: 'de-DE' } } })` in `astro.config.mjs`.
- **`public/robots.txt`** — allows all, declares `Sitemap: https://tastatur-und-maus.net/sitemap-index.xml`.
- **hreflang `<link rel="alternate">` tags** in `<head>` for each page, emitted by `i18n/index.ts`'s `hreflangPairs()` helper.

OG images per page, Twitter card meta, and schema.org/Event JSON-LD are deferred to v1.1.

### 13.6 404 page

Single bilingual `src/pages/404.astro` with both languages shown in the body ("Page not found / Seite nicht gefunden") and home links for both locales. Served by nginx's `error_page 404 /404.html`. Acceptable for v1 — per-locale 404s are a v1.1 item.

## 14. v1.1 follow-ups (to `docs/TODO.md`)

- Replace self-hosted Unsplash placeholder images with real Revision photography (from `tf.weimarnetz.de` or own archive); add responsive `<picture>` with WebP/AVIF; optimize at build.
- JS-driven animations: IntersectionObserver reveal, stats counter, hero photo parallax — all behind `prefers-reduced-motion`.
- Upgrade hamburger from CSS drawer to JS drawer (focus trap, aria-expanded, escape-to-close).
- Contact form (Formspree / Web3Forms / self-hosted).
- Umami analytics (`analytics.tastatur-und-maus.net`).
- OG images per page + Twitter card meta.
- schema.org/Event JSON-LD for Revision.
- Per-locale 404 page.
- a11y audit: skip link, focus-visible styles, ARIA landmarks, color contrast check.
- Pagefind search if content volume justifies it.
- Imprint, privacy, code of conduct content (real copy, bilingual).
- `scripts/fetch-photos.mjs` scraper for `tf.weimarnetz.de` with attribution manifest.

## 15. Open questions / assumptions

- **Verified:** Site A's CSS uses Instrument Serif (`site-a-editorial.html:25`), not Outfit. `@fontsource/instrument-serif@5.2.8` and `@fontsource/inter-tight@5.2.7` both exist on npm.
- **Assumption (plan will validate):** Astro 6's `prefixDefaultLocale: true` with no `src/pages/index.astro` produces no `dist/index.html`, allowing nginx's `location = /` to be the sole root handler without conflict.
- **Confirmed by user 2026-04-18:** `dfox288/tum-cluster-tum-websites_k8s` is the correct manifest repo.
- **Open (plan task):** exact k8s Deployment manifest filename inside `tum-cluster-tum-websites_k8s/tastatur-und-maus.net/` (drives the `sed` target in the deploy workflow).
- **Assumption:** The design handoff copy in EN and DE is production-ready and doesn't need legal/editorial review before v1 launch. If it does, content review is a separate workstream running in parallel.
- **Accepted trade-off:** `mailto:` contact links will be harvested by scrapers. v1 accepts the spam risk (addresses must appear on the imprint anyway under German law); a contact form ships in v1.1.
