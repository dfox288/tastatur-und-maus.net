# v1.1 follow-ups

Tracked in the spec at `docs/superpowers/specs/2026-04-18-tum-website-design.md` §14.

- [ ] Replace self-hosted Unsplash placeholders with real Revision photography (from tf.weimarnetz.de or own archive); responsive `<picture>` with WebP/AVIF.
- [ ] JS-driven animations: IntersectionObserver reveal on scroll, stats counter 0→target, hero photo parallax — behind `prefers-reduced-motion`.
- [ ] Upgrade the CSS hamburger drawer to a JS component (focus trap, aria-expanded, escape-to-close).
- [ ] Contact form (Formspree / Web3Forms / self-hosted) — replaces the v1 mailto: links.
- [ ] Umami analytics hookup to analytics.tastatur-und-maus.net.
- [ ] Per-page OG images + Twitter card meta.
- [ ] schema.org/Event JSON-LD for Revision.
- [ ] Per-locale 404 page.
- [ ] Accessibility audit: skip link, focus-visible styles, ARIA landmarks, color contrast.
- [ ] Pagefind search (if content volume grows).
- [ ] Full imprint, privacy, code of conduct copy (both locales).
- [ ] `scripts/fetch-photos.mjs` scraper for tf.weimarnetz.de with attribution manifest.
- [ ] Real sponsor logo assets replacing the placeholder wall.
- [ ] Move News "Read more / Weiterlesen" into `src/i18n/nav.ts` dict.
- [ ] Semantic `<time datetime="...">` in HistoryTimeline.
