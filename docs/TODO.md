# v1.1 roadmap

Snapshot of what's left after the v1 implementation + post-launch audit sweep. Originally tracked in `docs/superpowers/specs/2026-04-18-tum-website-design.md` §14; reconciled here against what actually shipped through commit `75b726b`.

## Content & design

- [ ] Replace self-hosted Unsplash placeholder images with real Revision photography (from `tf.weimarnetz.de` or own archive).
- [ ] Add responsive `<picture>` with WebP/AVIF variants for hero + gallery (~1 MB → ~250 KB on mobile).
- [ ] Branded OG/Twitter share card — v1 ships a solid `#14131a` placeholder at `public/og-default.jpg`. Replace with a real 1200×630 with logo + wordmark.
- [ ] Real sponsor logo assets replacing the placeholder name tiles in `SponsorWall`.
- [ ] Full imprint, privacy, and code of conduct copy in both locales (v1 stubs say "placeholder for v1").
- [ ] News detail pages under `/en/news/[slug]/` + `/de/news/[slug]/`. Re-introduce a "Read more →" link on the cards once destinations exist. Move the label into `src/i18n/nav.ts` so it ships from the dict.

## Interactions & animations

- [ ] JS-driven animations (all behind `prefers-reduced-motion`):
  - IntersectionObserver scroll-reveal on `.reveal` elements.
  - Stats counter 0 → target over ~1.4s.
  - Hero photo parallax on scroll.
- [ ] Upgrade the CSS-only hamburger drawer to a JS component with proper focus trap, `aria-expanded`, and matching `aria-controls`. v1 already has Escape-to-close and body-scroll lock wired, so the remaining work is focus trap and the ARIA attributes.
- [ ] Contact form backend (Formspree / Web3Forms / self-hosted) — replaces the v1 `mailto:` links.

## SEO

- [ ] `schema.org/NewsArticle` JSON-LD on news detail pages (once they exist).
- [ ] Per-page OG images (hero-specific for the home, context-appropriate for legal/news pages).
- [ ] Font subsetting — current `@fontsource` imports ship full Latin Extended; switch to `latin-*` variants (~320 KB → ~90 KB total). Preload the hero weight.

## Accessibility & UX

- [ ] A11y audit against WCAG 2.1 AAA targets (v1 covers AA).
- [ ] Semantic `<time datetime="...">` in `HistoryTimeline` years and `News` dates.
- [ ] Per-locale 404 pages at `/en/404/` and `/de/404/` (v1 ships a single bilingual 404).
- [ ] Countdown days — add `aria-label="Days until Revision 2027"` on the wrapper for SR context.

## Ops & analytics

- [ ] Umami analytics — script wired in `BaseLayout` and disclosed in the privacy pages; requires creating the site entry in the Umami dashboard and setting `PUBLIC_UMAMI_WEBSITE_ID` at build time.
- [ ] PR CI workflow (typecheck + unit + e2e) so `main` never breaks between pushes. `deploy.yml` runs only on push-to-main today.
- [ ] `scripts/fetch-photos.mjs` scraper for `tf.weimarnetz.de` with attribution manifest (supersedes the Unsplash fetcher once real photos land).
- [ ] Pagefind search — only if content volume grows enough to justify it.
- [ ] Optional PWA manifest + `manifest.webmanifest` (useful only if "Add to Home Screen" becomes a real use case).

## Before any deploy to production (external, user-owned)

From spec §13.4, unchanged by v1.1 — still blocking the first push:

1. Create folder `tastatur-und-maus.net/` in `dfox288/tum-cluster-tum-websites_k8s` with Deployment + Service + Ingress.
2. DNS for `tastatur-und-maus.net` → cluster ingress.
3. cert-manager / TLS issuer covers the host.
4. Generate an ed25519 deploy key; register the public half on the manifest repo with write access.
5. Add GH Actions secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `TUM_WEBSITES_K8S_PRIVATE_KEY`.
