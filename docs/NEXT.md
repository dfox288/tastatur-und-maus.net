# Where we left off — 2026-04-19

Checkpoint at commit `ac663b5`. Build clean, 12/12 E2E pass, working tree clean.

## Site state

The home page now renders (in order) hero → ticker → stats → about → demoscene explainer → revision (dark card, logo beside title) → history timeline → **parties (new)** → **member CTA (new)** → sponsors pitch → money breakdown → tiers → trust block → FAQ → past-sponsors placeholder → sponsor wall → gallery → press → news → contact.

Imprint, privacy, and code-of-conduct exist per locale. Privacy page discloses Umami analytics. Legal pages have real TUM e.V. data (Landstraße 35, Hemsbach, Vorstand: Reza Esmaili + Benjamin Metz, VR 5219 Amtsgericht Saarbrücken, etc.). 404 is bilingual and noindexed.

## Today's commit run (most recent first)

- `ac663b5` feat: "Beyond Revision" parties list (The Ultimate Meeting 1999-2013, Revision 2011-, and 7 supported parties across DE/CH/NL)
- `3f42dc2` content: `E-Werk` → `E Werk` across 13 files
- `1af8990` / `5ea1ccc` content + feat: Member CTA at order 6.5
- `df421cf` / `c97ca0c` linkified archive note (pouet/demozoo/scene.org)
- `ade0738` / `57fd10b` / `c4ebee4` / `af2fa1b` Revision section: logo, kicker-on-dark fix, body-under-headline grid
- `7ee470b` / `f8cf773` tf.weimarnetz.de → /revision2026/, archive link fixes
- `9120269` / `6e167a7` real Viscid photos + `scripts/fetch-photos.mjs`
- `d9ee213` Umami analytics + nav-on-subpages fix
- `54267f8` / `bf081e8` real legal data from revision-party.net
- `8c776b6` / `d8b9305` TUM founded 2007 (not 2008), softened stats to match archive
- `7919c1c` added 5 sponsor-adjacent sections (demoscene, money, trust, FAQ, past)
- `403f7b3` massive bilingual copy rewrite per scene/sponsor writer audits

## User-action items (blocked on you)

Before a real deploy:

1. **Email aliases.** Site now publishes these addresses — make sure they route somewhere:
   - `verein@tastatur-und-maus.net` (imprint primary contact)
   - `privacy@tastatur-und-maus.net` (GDPR contact on privacy page)
   - `sponsors@tastatur-und-maus.net` (sponsor CTAs)
   - `press@tastatur-und-maus.net` (press section)
   - `info@tastatur-und-maus.net` (general contact)
   - `safety@tastatur-und-maus.net` (code of conduct)
2. **Umami.** Create a site entry in the Umami dashboard at `analytics.tastatur-und-maus.net` and set `PUBLIC_UMAMI_WEBSITE_ID` at build time. Until this is set, the script tag isn't emitted — the privacy page disclosure is accurate either way.
3. **k8s deploy** (from spec §13.4): manifest folder in `tum-cluster-tum-websites_k8s`, DNS, TLS, deploy key, three GH Actions secrets.
4. **Branded OG image.** `public/og-default.jpg` is a 1200×630 solid `#14131a` placeholder. Replace with a real branded card before social-share testing.

## Open questions you still need to eyeball

- **Hero photo.** Current is `IMG_9481_DxO.jpg` (swapped once from IMG_0030). If still not "hall/bigscreen" enough, either `npm run fetch:photos -- --year 2026 --list` and pick specific filenames, or tell me what subject to hunt for and I'll rotate.
- **Stats** — "40+ countries every year" is roughly the 2020/2026 range (42 / 47). Fine as a floor; confirm wording works.
- **YouTube "10M+ archive views"** — still unverified.
- **UNESCO country list** — still asserts 7 countries (FI, DE, FR, SE, NL, CH, PL). Verify if you want it precise.
- **Parties section placement** — sits at order 6.3 (after history, before member CTA). If you want it before Revision for a "here's the body of work → zoom into Revision" flow, one-line order change.
- **Sponsor wall** — still placeholder company names (Acme Systems, Byteforge, …). Replace with real sponsor logos for v1.1.

## Candidate starting points for tomorrow

1. Visual pass on the new Parties + Member sections IRL (dev server on port 4321).
2. Decide on the hero photo (iterate or keep).
3. Final sanity on the home-page flow top-to-bottom.
4. Start external deploy prep (Docker Hub secrets, k8s manifest) if you want a real deploy this week.
5. Longer-tail: real sponsor logos, branded OG image, news detail pages, full legal copy.

The broader v1.1 backlog lives in `docs/TODO.md`; this note is point-in-time context for picking up tomorrow. Merge or delete it whenever it stops being useful.
