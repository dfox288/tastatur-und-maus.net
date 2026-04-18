# Handoff: Tastatur und Maus e.V. Website

## Overview
A website for the non-profit association **Tastatur und Maus e.V.**, which organises **Revision** — the world's largest demoparty — every Easter in Saarbrücken, Germany. The site's primary goal is to attract sponsors and partners for future events while also serving the demoscene community. It includes bilingual content (EN/DE).

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy directly. The task is to **recreate these HTML designs in a real web framework** (e.g. Next.js, Astro, SvelteKit, or similar static-site-friendly framework) using best practices for a production website. The HTML prototypes use vanilla JS with all content inlined via a shared `content.js` file — in production this should become a proper CMS or i18n system.

## Fidelity
**High-fidelity.** The prototypes are pixel-accurate with final colors, typography, spacing, and interactions. The developer should match the visual output closely. The selected design direction is **Site A — Editorial** (`site-a-editorial.html`).

---

## Design Tokens

### Colors
| Token | Hex | Usage |
|-------|-----|-------|
| `--paper` | `#f4f4f2` | Page background |
| `--paper-2` | `#e9e9e6` | Secondary background (cards, aside) |
| `--ink` | `#14131a` | Primary text, headings |
| `--ink-2` | `#3a3843` | Body text |
| `--muted` | `#7a7680` | Tertiary text, labels |
| `--rule` | `#d2d2cc` | Borders, dividers |
| `--red` | `#c8203a` | Primary accent (CTA, highlights) |
| `--red-ink` | `#8e0f22` | Dark red (hover states) |
| `--stream` | `#3b4f7a` | Cool secondary (informational) |
| `--ok` | `#2f6e4a` | Success/positive |

### Typography
| Role | Font | Weight | Notes |
|------|------|--------|-------|
| Display / Headlines | **Outfit** | 700–800 | `letter-spacing: -0.025em`, `line-height: 1.02` |
| Body | **Inter Tight** | 400–600 | `font-feature-settings: "ss01","cv11"` |
| Mono / Labels | **JetBrains Mono** | 400–500 | Kickers, metadata, technical labels |

All available on Google Fonts.

### Spacing & Layout
- Max content width: `1320px`
- Container padding: `40px` (desktop), `20px` (mobile)
- Section padding: `120px 0` vertical
- Standard gap: `48px` (grid gaps), `20px` (card gaps)
- Border radius: `4px` (cards), `6px` (photo card), `999px` (buttons/pills)

### Shadows
- Photo card: `0 30px 60px -10px rgba(20,19,26,.18)`
- Heritage badge: `0 4px 12px rgba(0,0,0,.1)`

---

## Screens / Sections

### 1. Top Bar (sticky)
- Full-width TUM logo (`assets/tum-logo.png`, height 34px) on left
- Navigation links center: Association, Revision, History, Sponsor us, Gallery, Press, Contact
- Right: EN/DE language toggle pill + "Become a sponsor" primary button
- Background: semi-transparent paper with `backdrop-filter: blur(8px)`
- Border appears on scroll

### 2. Hero Section
- **Layout:** Two-column grid (1.15fr / 0.85fr), items aligned to bottom
- **Left column:**
  - Eyebrow: red dot (animated pulse) + mono kicker "Tastatur und Maus e.V. — since 2008"
  - Headline: `clamp(56px, 8.8vw, 138px)`, Outfit 700. "We love computer art. Come join us." — "us." in red italic `<em>`
  - Subtitle: `clamp(17px, 1.4vw, 21px)` body text about the festival
  - Two CTAs: primary "Become a sponsor" + ghost "About Revision 2027"
  - Countdown strip: days-to-event number (red italic, 40px serif) + mono label with event date
- **Right column:** Photo card with:
  - Background image (Revision event photo), cover fit, subtle parallax on scroll
  - Gradient overlay (bottom-up dark)
  - Red tag badge "Revision 2026" top-left
  - Italic caption bottom-left
  - UNESCO heritage badge (white card, top-right): diamond icon + "UNESCO intangible cultural heritage"

### 3. Ticker Strip
- Horizontal auto-scrolling marquee (60s loop)
- Paper-2 background, ruled borders
- Serif italic text with red bold accents
- Content: "Revision 2027 · The Easter Party · Saarbrücken · since 2008 · code · music · pixels · non-profit"

### 4. Stats Section
- 4-column grid
- Each stat: large display number (`clamp(48px, 6.8vw, 96px)`) + mono label
- Numbers animate counting up on scroll (IntersectionObserver)
- Stats: 1,000+ visitors, 60+ countries, 10k+ YouTube, 7 UNESCO countries

### 5. About Section
- Two-column grid (1.1fr / 0.9fr)
- Left: kicker, h2 title, body paragraph, bullet list with red arrow markers
- Right: sticky aside card with rotating SVG seal ("TASTATUR UND MAUS · e.V. · GEMEINNÜTZIG · SINCE 2008") + fact rows (founded, status, registered, volunteers, parties run)
- Body text mentions UNESCO recognition in 7 countries

### 6. Revision Event Section
- Full-width dark card (`#14131a` background)
- Kicker, large h3 title, body text about Revision
- 4-column metadata grid: dates, venue, audience, edition
- Italic red link "Event archive →"
- Mentions E-Werk venue (1908 industrial hall), competition categories

### 7. History Timeline
- 6-column grid of timeline items
- Each: large year number (serif 40px), bold title, description text
- Items: 2008, 2011, 2015, 2020, 2024, 2027
- Red hover-bar animation on top of each item

### 8. Sponsors Section
- **Pitch area:** Two-column — left: body text about audience, right: sticky fact card with audience stats (reach, avg age, tech roles, retention, content afterlife)
- **Tier grid:** 3-column, 2-row grid (6 tiers total):
  - Private Supporter (individual)
  - Corporate Supporter (from €500, 1 ticket)
  - Partner (from €1,500, 2 tickets)
  - Silver (from €3,000, 2 tickets)
  - **Gold** (from €5,000, 4 tickets) — featured/highlighted with dark background + red badge "Most popular"
  - Platinum (on request, 5+ tickets)
- Each tier: name (serif 36px), price (mono), perk list with "+" markers
- CTA button: "Request a sponsor deck"
- **Sponsor wall:** 6-column logo grid with placeholder company names, hover highlight

### 9. Gallery
- 12-column CSS grid with varying spans (7×3, 5×2, 5×2, 4×2, 4×2, 4×2)
- Each cell: background-image cover, dark gradient overlay, mono caption label
- Images sourced from Unsplash placeholders (replace with real Revision photos)

### 10. Press Kit
- Two-column: body text left, file list right
- Files: logo pack, brand guidelines, photo archive, fact sheet
- Each file row: serif name + mono metadata + download arrow icon
- Hover: indent left + red color

### 11. News
- 3-column grid of news cards
- Each: date + tag row (mono), h4 title (serif 28px), excerpt, "Read more →" link
- 3 placeholder articles about Revision 2026 recap, 2027 dates, hardware programme

### 12. Contact
- Dark background section (`#14131a`)
- Two-column: left = contact channels (sponsor/press/general email links) + address, right = red CTA card with bubble watermark, heading, body text, white button
- Email links in serif italic 26px, hover pink

### 13. Footer
- Paper background, mono text
- Copyright + legal links (Imprint, Privacy, Code of Conduct)

---

## Interactions & Behavior

### Language Toggle
- EN/DE toggle button switches all content globally
- Persisted in `localStorage` key `tum_lang_a`
- All text comes from a bilingual content object

### Scroll Effects
- **Sticky topbar** gains border on scroll
- **Stats counter** animation: numbers count from 0 to target over 1.4s with cubic easing, triggered by IntersectionObserver
- **Reveal animations**: elements with `.reveal` fade in + translate up on scroll intersection
- **Hero photo parallax**: subtle upward translate on scroll (`scrollY * 0.06`)
- **Audience chart bars** (if kept from sponsor section): width animates on visibility

### Countdown
- Days until April 2, 2027 00:00 UTC
- Displayed as large serif number in hero countdown strip

### Responsive
- Grid collapses to single column below 980px (hero), 900px (content sections), 800px (stats to 2-col)
- Navigation hidden on mobile (needs hamburger menu in production)
- Gallery collapses to single column below 900px

---

## Assets

| File | Description |
|------|-------------|
| `assets/tum-logo.png` | Full wordmark logo (bubble + "Tastatur und Maus e.V.") |
| `assets/tum-bubble.png` | Red speech bubble icon (favicon, decorative) |
| `assets/content.js` | Bilingual content data (EN/DE) + photo URLs + sponsor placeholders |

### Photo Placeholders
Gallery and hero use Unsplash URLs as placeholders. These should be replaced with real Revision photography from the tf.weimarnetz.de archive or your own photo library. The Unsplash images are just for mood/layout reference.

---

## Content / i18n
All content is defined in `assets/content.js` as a `window.TUM_CONTENT` object keyed by `en` and `de`. In production, this should become a proper i18n solution (e.g. `next-intl`, JSON locale files, or a headless CMS).

Key content sections: `nav`, `hero`, `stats`, `about`, `revision`, `history`, `sponsors` (with 6 tier objects), `gallery`, `press`, `news`, `contact`, `footer`.

---

## Production Recommendations
1. **Framework:** Astro or Next.js — both handle static generation well for this type of site
2. **CMS:** Consider Sanity, Strapi, or simple Markdown/JSON for content management
3. **Images:** Download real Revision photos, optimize with modern formats (WebP/AVIF), use responsive `<picture>` elements
4. **Mobile nav:** Add hamburger menu — not implemented in prototype
5. **Forms:** Contact section should have an actual form or integrate with a service like Formspree
6. **Analytics:** Add privacy-respecting analytics (Plausible, Fathom)
7. **Accessibility:** Add proper ARIA labels, skip links, focus management
8. **SEO:** Open Graph tags, structured data for the event (schema.org/Event)
9. **Performance:** Self-host fonts, lazy-load images, preload critical assets

---

## Files in This Bundle
| File | Purpose |
|------|---------|
| `site-a-editorial.html` | **Primary design reference** — the approved direction |
| `assets/content.js` | All bilingual content data |
| `assets/tum-logo.png` | Full wordmark logo |
| `assets/tum-bubble.png` | Bubble icon |
| `site-b-scene.html` | Alternative design (dark/CRT) — for reference only |
| `site-c-broadsheet.html` | Alternative design (newspaper) — for reference only |
