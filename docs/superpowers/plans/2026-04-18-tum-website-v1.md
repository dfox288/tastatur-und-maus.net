# TUM website v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a bilingual (EN/DE) static site for Tastatur und Maus e.V. that recreates the "Site A — Editorial" design in Astro v6 + Tailwind v4, deployed to the existing self-hosted k8s cluster via the same GitOps pattern as `archive.revision-party.net`.

**Architecture:** Astro content collections (Zod-typed, discriminated-union schemas for the home page's 11 sections) render a section dispatcher on `/en/` and `/de/` routes. Language switch is via URL prefix; nginx handles the bare `/` with an `Accept-Language`-aware 302. Design tokens live in a `@theme {}` block so Tailwind v4 auto-generates utilities. Placeholder photography is downloaded at build time (no runtime third-party requests). CSS-only animations and mobile drawer; three narrow exceptions use small inline scripts (countdown, TopBar scroll-border toggle, lang-swap anchors — the last two are really just CSS selectors). Static output served by nginx in a Docker image, deployed via GH Actions → Docker Hub → manifest-repo bump.

**Tech Stack:** Astro v6, Tailwind CSS v4 (`@tailwindcss/vite`), TypeScript, Node ≥22.12, `@fontsource/{inter-tight,jetbrains-mono,instrument-serif}`, `@astrojs/sitemap`, Vitest (unit tests for helpers), Playwright (one E2E smoke), Docker (multi-stage Node→nginx), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-18-tum-website-design.md` (rev 2).

---

## Pre-implementation notes

- **Working directory:** `/Users/dfox/Development/dfox288/tastatur-und-maus.net` (repo root).
- **Starting state:** Two commits on `main` — the design handoff import (`c6b0dca`) and the design spec (`6bf0749` for revision 2). No Astro project yet.
- **Branching:** work directly on `main` unless you prefer a feature branch. Frequent commits, conventional commit style (`feat:`, `fix:`, `chore:`, `docs:`), no AI bylines (user's global CLAUDE.md enforces this).
- **Blocking external work** (from spec §13.4) — can be done in parallel with implementation, must be done before first deploy:
  1. Create folder `tastatur-und-maus.net/` in `dfox288/tum-cluster-tum-websites_k8s` with Deployment, Service, Ingress manifests.
  2. Configure DNS for `tastatur-und-maus.net`.
  3. cert-manager / TLS for the host.
  4. Generate ed25519 deploy key, register public half on manifest repo.
  5. Add GH Actions secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `TUM_WEBSITES_K8S_PRIVATE_KEY`.

## Testing strategy

- **Zod schemas at build time** — the primary content validator. `npm run build` fails loudly on malformed frontmatter.
- **Vitest** (`npm run test`) — unit tests for pure TS helpers in `src/i18n/` and the migration script.
- **Playwright** (`npm run test:e2e`) — one smoke test against `astro preview`: both locales render, key headings present, language toggle swaps URL, countdown shows an integer, hamburger opens on mobile viewport.
- **Manual / curl** — Accept-Language redirect verified manually against the built Docker image before first deploy.

---

## Phase 1 — Project scaffold & housekeeping

### Task 1: Move design handoff to `docs/`

**Files:**
- Move: `design_handoff_tum_website/` → `docs/design-handoff/`

- [ ] **Step 1: Run the move**

```bash
git mv design_handoff_tum_website docs/design-handoff
```

- [ ] **Step 2: Verify**

```bash
ls docs/design-handoff
```
Expected: `README.md  assets/  site-a-editorial.html  site-b-scene.html  site-c-broadsheet.html`

- [ ] **Step 3: Commit**

```bash
git commit -m "chore: move design handoff into docs/"
```

---

### Task 2: Initialize Astro project at repo root

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `astro.config.mjs`
- Create: `.gitignore`
- Create: `src/env.d.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "tastatur-und-maus",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "typecheck": "astro check",
    "fetch:unsplash": "node scripts/fetch-unsplash.mjs",
    "migrate:content": "node scripts/migrate-content.mjs"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.7.2",
    "@fontsource/inter-tight": "^5.2.7",
    "@fontsource/instrument-serif": "^5.2.8",
    "@fontsource/jetbrains-mono": "^5.2.8",
    "astro": "^6.1.5"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@tailwindcss/vite": "^4.2.2",
    "@types/node": "^22.10.0",
    "tailwindcss": "^4.2.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "~/*": ["src/*"] }
  }
}
```

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tastatur-und-maus.net',
  trailingSlash: 'always',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en-US', de: 'de-DE' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- [ ] **Step 4: Create `.gitignore`**

```
# Dependencies & build output
node_modules
dist
.astro
.cache

# Editor / OS
.DS_Store
.vscode/
.idea/
Thumbs.db
desktop.ini

# Claude Code local state
.claude/

# Playwright
test-results/
playwright-report/
playwright/.cache/

# Environment & logs
.env
.env.*
!.env.example
*.log
npm-debug.log*
```

- [ ] **Step 5: Create `src/env.d.ts`**

```ts
/// <reference path="../.astro/types.d.ts" />
```

- [ ] **Step 6: Install dependencies**

```bash
npm install
```
Expected: `package-lock.json` is created; no errors.

- [ ] **Step 7: Verify scaffold**

```bash
npx astro info
```
Expected: prints Astro v6.x, no config errors.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tsconfig.json astro.config.mjs .gitignore src/env.d.ts
git commit -m "feat: scaffold Astro v6 + Tailwind v4 project"
```

---

### Task 3: Create design token stylesheet

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Write `src/styles/global.css`**

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

/* Base resets */
* { box-sizing: border-box; }
html, body {
  margin: 0;
  padding: 0;
  background: var(--color-paper);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-feature-settings: "ss01", "cv11";
  -webkit-font-smoothing: antialiased;
}
body { overflow-x: hidden; }
a { color: inherit; }
img { max-width: 100%; display: block; }

h1, h2, h3, h4 {
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: -0.015em;
  margin: 0;
  line-height: 1.02;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add design tokens and base styles"
```

---

## Phase 2 — i18n helpers

### Task 4: Write i18n helpers

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/nav.ts`
- Create: `tests/unit/i18n.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 2: Create `src/i18n/nav.ts`**

```ts
export type Locale = 'en' | 'de';

export const LOCALES: Locale[] = ['en', 'de'];
export const DEFAULT_LOCALE: Locale = 'en';

export const NAV: Record<Locale, Record<string, string>> = {
  en: {
    about: 'Association',
    revision: 'Revision',
    history: 'History',
    sponsors: 'Sponsor us',
    gallery: 'Gallery',
    press: 'Press',
    contact: 'Contact',
    becomeSponsor: 'Become a sponsor',
    switchTo: 'Switch to German',
    imprint: 'Imprint',
    privacy: 'Privacy',
    codeOfConduct: 'Code of Conduct',
    skipToContent: 'Skip to content',
    menu: 'Menu',
  },
  de: {
    about: 'Verein',
    revision: 'Revision',
    history: 'Geschichte',
    sponsors: 'Sponsor werden',
    gallery: 'Galerie',
    press: 'Presse',
    contact: 'Kontakt',
    becomeSponsor: 'Sponsor werden',
    switchTo: 'Auf Englisch wechseln',
    imprint: 'Impressum',
    privacy: 'Datenschutz',
    codeOfConduct: 'Verhaltenskodex',
    skipToContent: 'Zum Inhalt springen',
    menu: 'Menü',
  },
};
```

- [ ] **Step 3: Write the failing tests in `tests/unit/i18n.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { getLocale, oppositeLocale, route, hreflangPairs } from '~/i18n';

describe('getLocale', () => {
  it('returns en for /en/ prefixed URL', () => {
    expect(getLocale(new URL('https://x/en/'))).toBe('en');
  });
  it('returns de for /de/ prefixed URL', () => {
    expect(getLocale(new URL('https://x/de/sponsors/'))).toBe('de');
  });
  it('returns default en for bare root', () => {
    expect(getLocale(new URL('https://x/'))).toBe('en');
  });
});

describe('oppositeLocale', () => {
  it('swaps en to de', () => { expect(oppositeLocale('en')).toBe('de'); });
  it('swaps de to en', () => { expect(oppositeLocale('de')).toBe('en'); });
});

describe('route', () => {
  it('builds /en/ path', () => {
    expect(route('/', 'en')).toBe('/en/');
  });
  it('swaps locale prefix while preserving tail', () => {
    expect(route('/en/imprint/', 'de')).toBe('/de/imprint/');
  });
  it('preserves trailing slash', () => {
    expect(route('/de/sponsors', 'en')).toBe('/en/sponsors/');
  });
});

describe('hreflangPairs', () => {
  it('emits both locales plus x-default', () => {
    const pairs = hreflangPairs('/en/imprint/', 'https://tastatur-und-maus.net');
    expect(pairs).toEqual([
      { hreflang: 'en', href: 'https://tastatur-und-maus.net/en/imprint/' },
      { hreflang: 'de', href: 'https://tastatur-und-maus.net/de/imprint/' },
      { hreflang: 'x-default', href: 'https://tastatur-und-maus.net/en/imprint/' },
    ]);
  });
});
```

- [ ] **Step 4: Run tests, verify they fail**

```bash
npm run test
```
Expected: FAIL — `Cannot find module '~/i18n'`.

- [ ] **Step 5: Implement `src/i18n/index.ts`**

```ts
import { LOCALES, DEFAULT_LOCALE, NAV, type Locale } from './nav';

export { LOCALES, DEFAULT_LOCALE, NAV, type Locale };

export function getLocale(url: URL): Locale {
  const segment = url.pathname.split('/').filter(Boolean)[0];
  if (segment === 'en' || segment === 'de') return segment;
  return DEFAULT_LOCALE;
}

export function oppositeLocale(locale: Locale): Locale {
  return locale === 'en' ? 'de' : 'en';
}

function withTrailingSlash(p: string): string {
  return p.endsWith('/') ? p : `${p}/`;
}

export function route(path: string, locale: Locale): string {
  const stripped = path.replace(/^\/(en|de)(?=\/|$)/, '');
  const normalized = stripped.startsWith('/') ? stripped : `/${stripped}`;
  return withTrailingSlash(`/${locale}${normalized}`.replace(/\/+/g, '/'));
}

export function t(locale: Locale, key: keyof typeof NAV['en']): string {
  return NAV[locale][key];
}

export interface HreflangPair { hreflang: string; href: string; }

export function hreflangPairs(path: string, origin: string): HreflangPair[] {
  const pairs: HreflangPair[] = LOCALES.map(locale => ({
    hreflang: locale,
    href: `${origin}${route(path, locale)}`,
  }));
  pairs.push({
    hreflang: 'x-default',
    href: `${origin}${route(path, DEFAULT_LOCALE)}`,
  });
  return pairs;
}
```

- [ ] **Step 6: Run tests, verify they pass**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/ tests/unit/i18n.test.ts vitest.config.ts
git commit -m "feat: add i18n helpers with unit tests"
```

---

## Phase 3 — Content model

### Task 5: Define content collection schemas

**Files:**
- Create: `src/content/config.ts`

- [ ] **Step 1: Write `src/content/config.ts`**

```ts
import { defineCollection, z } from 'astro:content';

const ctaSchema = z.object({ label: z.string(), href: z.string() });

const hero = z.object({
  section: z.literal('hero'),
  order: z.number(),
  eyebrow: z.string(),
  headline: z.string(),
  headlineAccent: z.string(),
  subtitle: z.string(),
  cta1: ctaSchema,
  cta2: ctaSchema,
  countdownLabel: z.string(),
  heroTag: z.string(),
  heroCaption: z.string(),
  heroImage: z.string(),
  heritageText: z.string(),
});

const ticker = z.object({
  section: z.literal('ticker'),
  order: z.number(),
  tokens: z.array(z.object({
    text: z.string(),
    emphasized: z.boolean().optional(),
  })).min(3),
});

const stats = z.object({
  section: z.literal('stats'),
  order: z.number(),
  items: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).length(4),
});

const about = z.object({
  section: z.literal('about'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  bullets: z.array(z.string()).min(1),
  facts: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(1),
});

const revision = z.object({
  section: z.literal('revision'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  meta: z.object({
    dates: z.string(),
    venue: z.string(),
    audience: z.string(),
    edition: z.string(),
  }),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

const history = z.object({
  section: z.literal('history'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
});

const sponsorsPitch = z.object({
  section: z.literal('sponsorsPitch'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  audienceFacts: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).min(1),
  ctaLabel: z.string(),
  ctaHref: z.string(),
});

const gallery = z.object({
  section: z.literal('gallery'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  tiles: z.array(z.object({
    image: z.string(),
    caption: z.string(),
    span: z.enum(['7x3', '5x2', '4x2']),
  })).length(6),
});

const press = z.object({
  section: z.literal('press'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
  files: z.array(z.object({
    name: z.string(),
    meta: z.string(),
    href: z.string(),
  })).min(1),
});

const news = z.object({
  section: z.literal('news'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
});

const contact = z.object({
  section: z.literal('contact'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  channels: z.array(z.object({
    label: z.string(),
    email: z.string(),
  })).min(1),
  address: z.string(),
  cardHeading: z.string(),
  cardBody: z.string(),
  cardCtaLabel: z.string(),
  cardCtaHref: z.string(),
});

export const homeSectionSchema = z.discriminatedUnion('section', [
  hero, ticker, stats, about, revision, history,
  sponsorsPitch, gallery, press, news, contact,
]);

export const collections = {
  home: defineCollection({
    type: 'content',
    schema: homeSectionSchema,
  }),
  sponsors: defineCollection({
    type: 'content',
    schema: z.object({
      tiers: z.array(z.object({
        name: z.string(),
        price: z.string(),
        perks: z.array(z.string()),
        highlight: z.boolean().optional(),
        highlightLabel: z.string().optional(),
      })).length(6),
    }),
  }),
  history: defineCollection({
    type: 'content',
    schema: z.object({
      items: z.array(z.object({
        year: z.string(),
        title: z.string(),
        description: z.string(),
      })).min(1),
    }),
  }),
  news: defineCollection({
    type: 'content',
    schema: z.object({
      date: z.string(),
      tag: z.string(),
      title: z.string(),
      excerpt: z.string(),
      order: z.number(),
    }),
  }),
};
```

- [ ] **Step 2: Commit**

```bash
git add src/content/config.ts
git commit -m "feat: define content collection schemas"
```

---

### Task 6: Write content migration script

**Files:**
- Create: `scripts/migrate-content.mjs`

- [ ] **Step 1: Write the script**

```js
#!/usr/bin/env node
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const handoffPath = join(repoRoot, 'docs/design-handoff/assets/content.js');
const contentRoot = join(repoRoot, 'src/content');

function loadHandoff() {
  const src = readFileSync(handoffPath, 'utf-8');
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return sandbox.window.TUM_CONTENT;
}

function writeYaml(path, frontmatter, body = '') {
  mkdirSync(dirname(path), { recursive: true });
  const fm = Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${toYaml(v, 0)}`)
    .join('\n');
  const content = `---\n${fm}\n---\n${body ? '\n' + body + '\n' : ''}`;
  writeFileSync(path, content);
}

function toYaml(value, indent) {
  const pad = ' '.repeat(indent);
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return quote(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    return '\n' + value.map(v => {
      if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        const entries = Object.entries(v);
        const [first, ...rest] = entries;
        const head = `${pad}- ${first[0]}: ${toYaml(first[1], indent + 2)}`;
        const tail = rest.map(([k, vv]) => `${pad}  ${k}: ${toYaml(vv, indent + 2)}`);
        return [head, ...tail].join('\n');
      }
      return `${pad}- ${toYaml(v, indent + 2)}`;
    }).join('\n');
  }
  if (typeof value === 'object') {
    return '\n' + Object.entries(value)
      .map(([k, v]) => `${pad}  ${k}: ${toYaml(v, indent + 2)}`)
      .join('\n');
  }
  return quote(String(value));
}

function quote(s) {
  if (s === '') return '""';
  if (/^[a-zA-Z0-9 ._\-:,!?€+]+$/.test(s) && !s.startsWith('-') && !/^\d/.test(s)) {
    return s.includes(':') ? `"${s.replace(/"/g, '\\"')}"` : s;
  }
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

function migrate() {
  const content = loadHandoff();
  for (const locale of ['en', 'de']) {
    const l = content[locale];
    const home = join(contentRoot, 'home', locale);

    // 01-hero
    writeYaml(join(home, '01-hero.md'), {
      section: 'hero',
      order: 1,
      eyebrow: l.hero.eyebrow,
      headline: l.hero.headline.replace(/ us\.$/, ''),
      headlineAccent: 'us.',
      subtitle: l.hero.sub,
      cta1: { label: l.hero.cta1, href: '#sponsors' },
      cta2: { label: l.hero.cta2, href: '#revision' },
      countdownLabel: l.hero.countdown,
      heroTag: 'Revision 2026',
      heroCaption: locale === 'en'
        ? 'A thousand friends, four days at Easter.'
        : 'Tausend Freunde, vier Tage an Ostern.',
      heroImage: '/images/hero.jpg',
      heritageText: locale === 'en'
        ? 'UNESCO intangible cultural heritage'
        : 'Immaterielles UNESCO-Kulturerbe',
    });

    // 02-ticker
    writeYaml(join(home, '02-ticker.md'), {
      section: 'ticker',
      order: 2,
      tokens: locale === 'en'
        ? [
            { text: 'Revision 2027', emphasized: true },
            { text: 'The Easter Party' },
            { text: 'Saarbrücken' },
            { text: 'since 2008' },
            { text: 'code', emphasized: true },
            { text: 'music' },
            { text: 'pixels' },
            { text: 'non-profit' },
          ]
        : [
            { text: 'Revision 2027', emphasized: true },
            { text: 'Die Osterparty' },
            { text: 'Saarbrücken' },
            { text: 'seit 2008' },
            { text: 'Code', emphasized: true },
            { text: 'Musik' },
            { text: 'Pixel' },
            { text: 'gemeinnützig' },
          ],
    });

    // 03-stats
    writeYaml(join(home, '03-stats.md'), {
      section: 'stats',
      order: 3,
      items: l.stats,
    });

    // 04-about
    writeYaml(join(home, '04-about.md'), {
      section: 'about',
      order: 4,
      kicker: l.about.kicker,
      title: l.about.title,
      body: l.about.body,
      bullets: l.about.bullets,
      facts: aboutFacts(locale),
    });

    // 05-revision
    writeYaml(join(home, '05-revision.md'), {
      section: 'revision',
      order: 5,
      kicker: l.revision.kicker,
      title: l.revision.title,
      body: l.revision.body,
      meta: {
        dates: l.revision.dates,
        venue: l.revision.venue,
        audience: l.revision.audience,
        edition: locale === 'en' ? '16th edition' : '16. Ausgabe',
      },
      ctaLabel: l.revision.cta,
      ctaHref: 'https://2027.revision-party.net',
    });

    // 06-history
    writeYaml(join(home, '06-history.md'), {
      section: 'history',
      order: 6,
      kicker: l.history.kicker,
      title: l.history.title,
    });

    // 07-sponsors-pitch
    writeYaml(join(home, '07-sponsors-pitch.md'), {
      section: 'sponsorsPitch',
      order: 7,
      kicker: l.sponsors.kicker,
      title: l.sponsors.title,
      body: l.sponsors.body,
      audienceFacts: audienceFacts(locale),
      ctaLabel: locale === 'en' ? 'Request a sponsor deck' : 'Sponsoring-Deck anfragen',
      ctaHref: 'mailto:sponsors@tastatur-und-maus.net',
    });

    // 08-gallery
    writeYaml(join(home, '08-gallery.md'), {
      section: 'gallery',
      order: 8,
      kicker: locale === 'en' ? 'Impressions' : 'Eindrücke',
      title: locale === 'en' ? 'What Easter looks like.' : 'So sieht Ostern aus.',
      tiles: galleryTiles(locale),
    });

    // 09-press
    writeYaml(join(home, '09-press.md'), {
      section: 'press',
      order: 9,
      kicker: locale === 'en' ? 'Press kit' : 'Pressemappe',
      title: locale === 'en' ? 'Everything journalists need.' : 'Alles für die Presse.',
      body: locale === 'en'
        ? 'Download our brand assets, fact sheet, and approved photography. For interviews or tailored materials, write to press@tastatur-und-maus.net.'
        : 'Logos, Fact Sheet und freigegebene Fotos zum Herunterladen. Für Interviews oder individuelle Materialien schreiben Sie an press@tastatur-und-maus.net.',
      files: pressFiles(locale),
    });

    // 10-news
    writeYaml(join(home, '10-news.md'), {
      section: 'news',
      order: 10,
      kicker: locale === 'en' ? 'News' : 'Neuigkeiten',
      title: locale === 'en' ? 'Latest from the association.' : 'Aktuelles aus dem Verein.',
    });

    // 11-contact
    writeYaml(join(home, '11-contact.md'), {
      section: 'contact',
      order: 11,
      kicker: locale === 'en' ? 'Contact' : 'Kontakt',
      title: locale === 'en' ? 'Get in touch.' : 'Kontakt aufnehmen.',
      channels: contactChannels(locale),
      address: 'Tastatur und Maus e.V.\nc/o Vorstand\n66111 Saarbrücken\nDeutschland',
      cardHeading: locale === 'en'
        ? 'Want to sponsor Revision 2027?'
        : 'Revision 2027 sponsern?',
      cardBody: locale === 'en'
        ? 'Tell us who you are and what kind of partnership you\'re thinking of. We\'ll send the deck and set up a call.'
        : 'Schreiben Sie uns kurz, wer Sie sind und welche Partnerschaft Ihnen vorschwebt. Wir senden das Deck und vereinbaren ein Gespräch.',
      cardCtaLabel: locale === 'en' ? 'Write to sponsors@' : 'An sponsors@ schreiben',
      cardCtaHref: 'mailto:sponsors@tastatur-und-maus.net',
    });

    // sponsors/tiers
    writeYaml(join(contentRoot, 'sponsors', locale, 'tiers.md'), {
      tiers: l.sponsors.tiers.map(t => {
        const out = { name: t.name, price: t.price, perks: t.perks };
        if (t.highlight) {
          out.highlight = true;
          out.highlightLabel = locale === 'en' ? 'Most popular' : 'Am beliebtesten';
        }
        return out;
      }),
    });

    // history/items
    writeYaml(join(contentRoot, 'history', locale, 'items.md'), {
      items: l.history.items.map(h => ({
        year: h.y,
        title: h.t,
        description: h.d,
      })),
    });

    // news articles (3 placeholders per locale)
    const articles = newsArticles(locale);
    articles.forEach((a, idx) => {
      writeYaml(
        join(contentRoot, 'news', locale, `${String(idx + 1).padStart(2, '0')}-${a.slug}.md`),
        { date: a.date, tag: a.tag, title: a.title, excerpt: a.excerpt, order: idx + 1 },
        a.body,
      );
    });
  }
  console.log('Migration complete.');
}

function aboutFacts(locale) {
  return locale === 'en'
    ? [
        { label: 'Founded', value: '2008' },
        { label: 'Status', value: 'Registered non-profit (e.V.)' },
        { label: 'Registered', value: 'Saarbrücken, Germany' },
        { label: 'Volunteers', value: '40+' },
        { label: 'Parties run', value: '16' },
      ]
    : [
        { label: 'Gegründet', value: '2008' },
        { label: 'Status', value: 'Gemeinnütziger eingetragener Verein' },
        { label: 'Registriert', value: 'Saarbrücken, Deutschland' },
        { label: 'Ehrenamtliche', value: '40+' },
        { label: 'Ausgerichtete Parties', value: '16' },
      ];
}

function audienceFacts(locale) {
  return locale === 'en'
    ? [
        { label: 'On-site reach', value: '1,000+' },
        { label: 'Live-stream reach', value: '50,000+ / year' },
        { label: 'Avg age', value: '32' },
        { label: 'Tech roles', value: '70%+' },
        { label: 'Retention', value: '10+ years avg' },
        { label: 'Content afterlife', value: '10M+ YouTube views' },
      ]
    : [
        { label: 'Vor-Ort-Reichweite', value: '1.000+' },
        { label: 'Livestream-Reichweite', value: '50.000+ pro Jahr' },
        { label: 'Durchschnittsalter', value: '32' },
        { label: 'Tech-Berufe', value: '70%+' },
        { label: 'Zugehörigkeit', value: 'Ø 10+ Jahre' },
        { label: 'Nachnutzung', value: '10M+ YouTube-Aufrufe' },
      ];
}

function galleryTiles(locale) {
  const captions = locale === 'en'
    ? ['Main hall, Friday night', 'Compo submissions', 'Pixel art up close',
       'Shader Showdown', 'Oldskool corner', 'The livestream']
    : ['Großer Saal, Freitagnacht', 'Compo-Einreichungen', 'Pixel-Art von Nahem',
       'Shader Showdown', 'Oldskool-Ecke', 'Der Livestream'];
  const spans = ['7x3', '5x2', '5x2', '4x2', '4x2', '4x2'];
  return captions.map((caption, i) => ({
    image: `/images/gallery-${String(i + 1).padStart(2, '0')}.jpg`,
    caption,
    span: spans[i],
  }));
}

function pressFiles(locale) {
  return locale === 'en'
    ? [
        { name: 'Logo pack', meta: 'ZIP · 4 MB · SVG + PNG', href: '/press/logo-pack.zip' },
        { name: 'Brand guidelines', meta: 'PDF · 2 MB', href: '/press/brand-guidelines.pdf' },
        { name: 'Photo archive', meta: 'External · tf.weimarnetz.de', href: 'https://tf.weimarnetz.de/' },
        { name: 'Fact sheet', meta: 'PDF · 180 KB', href: '/press/fact-sheet.pdf' },
      ]
    : [
        { name: 'Logo-Paket', meta: 'ZIP · 4 MB · SVG + PNG', href: '/press/logo-pack.zip' },
        { name: 'Brand Guidelines', meta: 'PDF · 2 MB', href: '/press/brand-guidelines.pdf' },
        { name: 'Fotoarchiv', meta: 'Extern · tf.weimarnetz.de', href: 'https://tf.weimarnetz.de/' },
        { name: 'Fact Sheet', meta: 'PDF · 180 KB', href: '/press/fact-sheet.pdf' },
      ];
}

function contactChannels(locale) {
  return locale === 'en'
    ? [
        { label: 'Sponsorship', email: 'sponsors@tastatur-und-maus.net' },
        { label: 'Press', email: 'press@tastatur-und-maus.net' },
        { label: 'General', email: 'info@tastatur-und-maus.net' },
      ]
    : [
        { label: 'Sponsoring', email: 'sponsors@tastatur-und-maus.net' },
        { label: 'Presse', email: 'press@tastatur-und-maus.net' },
        { label: 'Allgemein', email: 'info@tastatur-und-maus.net' },
      ];
}

function newsArticles(locale) {
  return locale === 'en'
    ? [
        {
          slug: 'revision-2026-recap', date: '2026-04-15', tag: 'Event recap',
          title: 'Revision 2026 — the recap',
          excerpt: 'Four days, 1,100 attendees, and the strongest shader showdown final in years. Here\'s what happened.',
          body: '',
        },
        {
          slug: 'revision-2027-dates', date: '2026-04-01', tag: 'Announcement',
          title: 'Save the date: Revision 2027 is April 2–5',
          excerpt: 'Easter weekend 2027 at the E-Werk in Saarbrücken. Ticketing opens in late summer.',
          body: '',
        },
        {
          slug: 'hardware-programme-2027', date: '2026-03-20', tag: 'Programme',
          title: 'A new hardware showcase for sponsors',
          excerpt: 'Gold and Platinum sponsors will get a dedicated hardware lane on the main stage at Revision 2027.',
          body: '',
        },
      ]
    : [
        {
          slug: 'revision-2026-rueckblick', date: '2026-04-15', tag: 'Rückblick',
          title: 'Revision 2026 — der Rückblick',
          excerpt: 'Vier Tage, 1.100 Besuchende und das stärkste Shader-Showdown-Finale seit Jahren. Ein Überblick.',
          body: '',
        },
        {
          slug: 'revision-2027-termin', date: '2026-04-01', tag: 'Ankündigung',
          title: 'Termin steht: Revision 2027 vom 2. bis 5. April',
          excerpt: 'Osterwochenende 2027 im E-Werk Saarbrücken. Ticketverkauf startet im Spätsommer.',
          body: '',
        },
        {
          slug: 'hardware-programm-2027', date: '2026-03-20', tag: 'Programm',
          title: 'Neues Hardware-Showcase für Sponsoren',
          excerpt: 'Gold- und Platin-Sponsoren erhalten bei Revision 2027 eine eigene Hardware-Lane auf der Hauptbühne.',
          body: '',
        },
      ];
}

migrate();
```

- [ ] **Step 2: Run the migration**

```bash
npm run migrate:content
```
Expected: `Migration complete.` Files appear under `src/content/home/{en,de}/*.md`, `src/content/sponsors/{en,de}/tiers.md`, `src/content/history/{en,de}/items.md`, `src/content/news/{en,de}/*.md`.

- [ ] **Step 3: Verify content types by building**

```bash
npm run build 2>&1 | head -30
```
Expected: build may fail later in the process (components not yet written) but Zod content validation passes. Look for "content/collections" success messages, no schema errors.

- [ ] **Step 4: Commit script + generated content**

```bash
git add scripts/migrate-content.mjs src/content/home src/content/sponsors src/content/history src/content/news
git commit -m "feat: migrate bilingual content from handoff into collections"
```

---

## Phase 4 — Asset pipeline

### Task 7: Write Unsplash fetch script

**Files:**
- Create: `scripts/fetch-unsplash.mjs`

- [ ] **Step 1: Identify the 7 Unsplash URLs**

Read `docs/design-handoff/site-a-editorial.html` and grep for `images.unsplash.com` — the hero image and the 6 gallery tiles use Unsplash URLs. Copy them into the script as `HERO_URL` and `GALLERY_URLS[0..5]`.

- [ ] **Step 2: Write the script**

```js
#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outDir = join(repoRoot, 'public/images');

// Extracted from docs/design-handoff/site-a-editorial.html
// These are Unsplash placeholder URLs. They will be replaced with real
// Revision photography in v1.1. Files self-hosted here to eliminate
// runtime third-party requests (GDPR posture for a German e.V.).
const IMAGES = [
  { out: 'hero.jpg',       url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1600&q=80' },
  { out: 'gallery-01.jpg', url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1600&q=80' },
  { out: 'gallery-02.jpg', url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200&q=80' },
  { out: 'gallery-03.jpg', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80' },
  { out: 'gallery-04.jpg', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&q=80' },
  { out: 'gallery-05.jpg', url: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=1000&q=80' },
  { out: 'gallery-06.jpg', url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1000&q=80' },
];

async function main() {
  mkdirSync(outDir, { recursive: true });
  const licenseLines = [
    'Unsplash placeholder photography — self-hosted by Tastatur und Maus e.V.',
    'Will be replaced with real Revision photography in v1.1.',
    'All images below are free to use under the Unsplash License (https://unsplash.com/license).',
    '',
  ];
  for (const img of IMAGES) {
    const target = join(outDir, img.out);
    if (existsSync(target)) {
      console.log(`skip  ${img.out} (exists)`);
      continue;
    }
    console.log(`fetch ${img.out}`);
    const res = await fetch(img.url);
    if (!res.ok) throw new Error(`${img.out}: ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(target, buf);
    licenseLines.push(`${img.out} <- ${img.url}`);
  }
  writeFileSync(join(outDir, 'LICENSES.txt'), licenseLines.join('\n') + '\n');
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
```

**Note on the URLs:** these are example IDs — when executing this task, open `docs/design-handoff/site-a-editorial.html` and `docs/design-handoff/assets/content.js`, extract the actual URLs used, and replace the placeholder IDs above.

- [ ] **Step 3: Run the fetcher**

```bash
npm run fetch:unsplash
```
Expected: 7 JPG files in `public/images/` + `LICENSES.txt`.

- [ ] **Step 4: Move logos from handoff to public**

```bash
cp docs/design-handoff/assets/tum-logo.png public/
cp docs/design-handoff/assets/tum-bubble.png public/
cp docs/design-handoff/assets/tum-bubble.png public/favicon.png
```

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch-unsplash.mjs public/images public/tum-logo.png public/tum-bubble.png public/favicon.png
git commit -m "feat: self-host placeholder imagery and logos"
```

---

## Phase 5 — Base layout and chrome

### Task 8: Write BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: Write `src/layouts/BaseLayout.astro`**

```astro
---
import '~/styles/global.css';
import { getLocale, hreflangPairs, t, type Locale } from '~/i18n';
import TopBar from '~/components/TopBar.astro';
import Footer from '~/components/Footer.astro';

interface Props {
  title: string;
  description?: string;
  image?: string;
  locale?: Locale;
}

const locale = Astro.props.locale ?? getLocale(Astro.url);
const { title, description, image } = Astro.props;
const canonical = new URL(Astro.url.pathname, Astro.site);
const ogImage = image ?? `${Astro.site}og-image.png`;
const effectiveDescription = description ?? (locale === 'en'
  ? 'Tastatur und Maus e.V. — the non-profit behind Revision, the world\'s biggest demoparty.'
  : 'Tastatur und Maus e.V. — der gemeinnützige Verein hinter Revision, der größten Demoparty der Welt.');
const hreflang = hreflangPairs(Astro.url.pathname, Astro.site?.origin ?? 'https://tastatur-und-maus.net');
---
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="/tum-bubble.png" />
    <link rel="canonical" href={canonical.href} />
    <meta name="description" content={effectiveDescription} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={effectiveDescription} />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Tastatur und Maus e.V." />
    <meta property="og:url" content={canonical.href} />
    <meta property="og:image" content={ogImage} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={effectiveDescription} />
    <meta name="twitter:image" content={ogImage} />
    {hreflang.map(p => <link rel="alternate" hreflang={p.hreflang} href={p.href} />)}
    <title>{title}</title>
    <slot name="head" />
  </head>
  <body>
    <a href="#main" class="sr-only focus:not-sr-only">{t(locale, 'skipToContent')}</a>
    <TopBar locale={locale} />
    <main id="main">
      <slot />
    </main>
    <Footer locale={locale} />
  </body>
</html>

<style is:global>
  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }
  .sr-only.focus\:not-sr-only:focus {
    position: fixed; top: 12px; left: 12px;
    width: auto; height: auto;
    padding: 12px 16px; margin: 0;
    clip: auto; white-space: normal;
    background: var(--color-ink); color: var(--color-paper);
    border-radius: 4px; z-index: 100;
  }
</style>
```

- [ ] **Step 2: Commit (layout depends on TopBar and Footer — will build once those exist)**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add BaseLayout with hreflang, OG meta, skip link"
```

---

### Task 9: Write TopBar component

**Files:**
- Create: `src/components/TopBar.astro`

- [ ] **Step 1: Write `src/components/TopBar.astro`**

```astro
---
import { oppositeLocale, route, t, type Locale } from '~/i18n';

interface Props { locale: Locale; }
const { locale } = Astro.props;
const other = oppositeLocale(locale);
const currentPath = Astro.url.pathname;
const otherUrl = route(currentPath, other);

const navLinks = [
  { key: 'about', href: '#about' },
  { key: 'revision', href: '#revision' },
  { key: 'history', href: '#history' },
  { key: 'sponsors', href: '#sponsors' },
  { key: 'gallery', href: '#gallery' },
  { key: 'press', href: '#press' },
  { key: 'contact', href: '#contact' },
] as const;
---
<header class="topbar" data-topbar>
  <div class="topbar-row">
    <a href={route('/', locale)} class="brand" aria-label="Tastatur und Maus e.V. home">
      <img src="/tum-logo.png" alt="Tastatur und Maus e.V." class="brand-logo" />
    </a>

    <nav class="nav" aria-label="Primary">
      {navLinks.map(l => (
        <a href={l.href}>{t(locale, l.key)}</a>
      ))}
    </nav>

    <div class="top-right">
      <a href={otherUrl} class="lang" aria-label={t(locale, 'switchTo')}>
        <span class={locale === 'en' ? 'on' : ''}>EN</span>
        <span>/</span>
        <span class={locale === 'de' ? 'on' : ''}>DE</span>
      </a>
      <a href="#sponsors" class="btn primary small">{t(locale, 'becomeSponsor')}</a>
      <input type="checkbox" id="mnav-toggle" class="mnav-toggle" aria-label={t(locale, 'menu')} />
      <label for="mnav-toggle" class="mnav-btn" aria-hidden="true">
        <span></span><span></span><span></span>
      </label>
    </div>
  </div>

  <div class="mnav-drawer">
    <nav aria-label="Mobile">
      {navLinks.map(l => (
        <a href={l.href} class="mnav-link">{t(locale, l.key)}</a>
      ))}
      <a href={otherUrl} class="mnav-link">{t(locale, 'switchTo')}</a>
      <a href="#sponsors" class="btn primary">{t(locale, 'becomeSponsor')}</a>
    </nav>
  </div>
</header>

<script is:inline>
  (function () {
    const bar = document.querySelector('[data-topbar]');
    if (!bar) return;
    const onScroll = () => bar.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  })();
</script>

<style>
  .topbar {
    position: sticky; top: 0; z-index: 50;
    background: color-mix(in oklab, var(--color-paper) 88%, transparent);
    -webkit-backdrop-filter: blur(8px);
    backdrop-filter: blur(8px);
    border-bottom: 1px solid transparent;
    transition: border-color .2s;
  }
  .topbar.scrolled { border-color: var(--color-rule); }
  .topbar-row {
    display: flex; align-items: center; justify-content: space-between;
    height: 72px; gap: 20px;
    max-width: 1320px; margin: 0 auto; padding: 0 40px;
  }
  .brand-logo { height: 34px; width: auto; }
  .nav { display: flex; gap: 28px; align-items: center; }
  .nav a {
    text-decoration: none; color: var(--color-ink-2);
    font-size: 14px; font-weight: 500;
    transition: color .15s;
  }
  .nav a:hover { color: var(--color-red); }
  .top-right { display: flex; align-items: center; gap: 14px; }
  .lang {
    border: 1px solid var(--color-rule);
    padding: 6px 10px; border-radius: 999px;
    font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em;
    color: var(--color-ink); text-decoration: none;
    display: inline-flex; gap: 6px;
  }
  .lang span { opacity: .35; transition: opacity .15s; }
  .lang span.on { opacity: 1; }
  .btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 20px; border-radius: 999px;
    font-weight: 600; font-size: 14px;
    text-decoration: none; border: 1px solid transparent; cursor: pointer;
    transition: background .15s;
    font-family: var(--font-sans);
  }
  .btn.primary { background: var(--color-ink); color: var(--color-paper); }
  .btn.primary:hover { background: var(--color-red); }
  .btn.small { padding: 9px 14px; font-size: 13px; }

  /* Mobile drawer */
  .mnav-toggle, .mnav-btn { display: none; }
  .mnav-drawer { display: none; }

  @media (max-width: 980px) {
    .nav { display: none; }
    .top-right .lang, .top-right .btn { display: none; }
    .mnav-btn {
      display: inline-flex; flex-direction: column; gap: 4px;
      width: 28px; cursor: pointer;
    }
    .mnav-btn span {
      display: block; height: 2px; background: var(--color-ink);
      transition: transform .2s, opacity .2s;
    }
    .mnav-toggle:checked ~ .mnav-btn span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
    .mnav-toggle:checked ~ .mnav-btn span:nth-child(2) { opacity: 0; }
    .mnav-toggle:checked ~ .mnav-btn span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    .mnav-drawer {
      display: block;
      position: fixed; inset: 72px 0 0 0;
      background: var(--color-paper);
      padding: 40px 20px; height: calc(100vh - 72px);
      transform: translateX(100%);
      transition: transform .25s ease;
      z-index: 40;
    }
    .mnav-toggle:checked ~ .mnav-drawer,
    .topbar:has(.mnav-toggle:checked) .mnav-drawer { transform: translateX(0); }
    .mnav-drawer nav { display: flex; flex-direction: column; gap: 18px; }
    .mnav-link {
      font-family: var(--font-display); font-size: 32px;
      color: var(--color-ink); text-decoration: none;
    }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TopBar.astro
git commit -m "feat: add TopBar with hamburger drawer and lang toggle"
```

---

### Task 10: Write Footer component

**Files:**
- Create: `src/components/Footer.astro`

- [ ] **Step 1: Write `src/components/Footer.astro`**

```astro
---
import { t, type Locale, route } from '~/i18n';
interface Props { locale: Locale; }
const { locale } = Astro.props;
const year = new Date().getFullYear();
---
<footer class="footer">
  <div class="footer-row">
    <div class="copyright">© {year} Tastatur und Maus e.V. · Saarbrücken</div>
    <nav class="legal" aria-label="Legal">
      <a href={route('/imprint', locale)}>{t(locale, 'imprint')}</a>
      <a href={route('/privacy', locale)}>{t(locale, 'privacy')}</a>
      <a href={route('/code-of-conduct', locale)}>{t(locale, 'codeOfConduct')}</a>
    </nav>
  </div>
</footer>

<style>
  .footer {
    background: var(--color-paper);
    border-top: 1px solid var(--color-rule);
    padding: 40px 0;
  }
  .footer-row {
    max-width: 1320px; margin: 0 auto; padding: 0 40px;
    display: flex; justify-content: space-between;
    gap: 20px; flex-wrap: wrap;
    font-family: var(--font-mono); font-size: 12px;
    color: var(--color-muted);
  }
  .legal { display: flex; gap: 20px; }
  .legal a { color: var(--color-muted); text-decoration: none; transition: color .15s; }
  .legal a:hover { color: var(--color-red); }
  @media (max-width: 720px) {
    .footer-row { padding: 0 20px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: add Footer with bilingual legal links"
```

---

## Phase 6 — Primitives

### Task 11: Write Button, Kicker, PhotoCard, HeritageBadge primitives

**Files:**
- Create: `src/components/primitives/Button.astro`
- Create: `src/components/primitives/Kicker.astro`
- Create: `src/components/primitives/PhotoCard.astro`
- Create: `src/components/primitives/HeritageBadge.astro`

- [ ] **Step 1: Write `Button.astro`**

```astro
---
interface Props {
  href: string;
  variant?: 'primary' | 'ghost';
  size?: 'normal' | 'small';
  arrow?: boolean;
  rel?: string;
  target?: string;
}
const { href, variant = 'primary', size = 'normal', arrow = false, rel, target } = Astro.props;
const cls = ['btn', variant, size === 'small' ? 'small' : ''].filter(Boolean).join(' ');
---
<a href={href} class={cls} rel={rel} target={target}>
  <slot />
  {arrow && <span class="arr">→</span>}
</a>

<style>
  .btn {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 20px; border-radius: 999px;
    font-weight: 600; font-size: 14px;
    text-decoration: none; border: 1px solid transparent; cursor: pointer;
    transition: background .15s, color .15s, border-color .15s;
    font-family: var(--font-sans);
  }
  .btn.primary { background: var(--color-ink); color: var(--color-paper); }
  .btn.primary:hover { background: var(--color-red); }
  .btn.ghost { background: transparent; color: var(--color-ink); border-color: var(--color-ink); }
  .btn.ghost:hover { background: var(--color-ink); color: var(--color-paper); }
  .btn.small { padding: 9px 14px; font-size: 13px; }
  .arr { font-family: var(--font-mono); font-weight: 400; }
</style>
```

- [ ] **Step 2: Write `Kicker.astro`**

```astro
---
interface Props { as?: 'span' | 'div' | 'p'; }
const { as = 'span' } = Astro.props;
const Tag = as;
---
<Tag class="kicker"><slot /></Tag>

<style>
  .kicker {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--color-muted);
    display: inline-flex; align-items: center; gap: 10px;
  }
  .kicker::before {
    content: ""; width: 22px; height: 1px;
    background: var(--color-ink); opacity: .4;
    display: inline-block;
  }
</style>
```

- [ ] **Step 3: Write `PhotoCard.astro`**

```astro
---
interface Props {
  image: string;
  tag?: string;
  caption?: string;
  minHeight?: string;
}
const { image, tag, caption, minHeight = '460px' } = Astro.props;
---
<div class="photo-card" style={`--min-h: ${minHeight}`}>
  <div class="photo" style={`background-image: url('${image}')`}></div>
  <div class="overlay"></div>
  <div class="caption">
    {tag && <span class="tag">{tag}</span>}
    {caption && <div class="text">{caption}</div>}
  </div>
  <slot />
</div>

<style>
  .photo-card {
    position: relative; width: 100%;
    min-height: var(--min-h);
    border-radius: 6px; overflow: hidden;
    box-shadow: 0 30px 60px -10px rgba(20, 19, 26, .18);
  }
  .photo {
    position: absolute; inset: 0;
    background-size: cover; background-position: center;
    transition: transform 6s ease;
  }
  .photo-card:hover .photo { transform: scale(1.04); }
  .overlay {
    position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(20,19,26,.7) 0%, rgba(20,19,26,.05) 50%);
  }
  .caption {
    position: absolute; bottom: 24px; left: 24px; right: 24px;
    color: #fff; z-index: 2;
  }
  .tag {
    font-family: var(--font-mono); font-size: 10px;
    letter-spacing: .14em; text-transform: uppercase;
    color: rgba(255,255,255,.95);
    margin-bottom: 10px; display: inline-block;
    background: var(--color-red); padding: 4px 8px; border-radius: 2px;
  }
  .text {
    font-family: var(--font-display); font-style: italic;
    font-size: clamp(22px, 2.4vw, 32px); line-height: 1.15;
  }
</style>
```

- [ ] **Step 4: Write `HeritageBadge.astro`**

```astro
---
interface Props { text: string; }
const { text } = Astro.props;
---
<div class="heritage">
  <span class="icon" aria-hidden="true">◆</span>
  <span class="text">{text}</span>
</div>

<style>
  .heritage {
    position: absolute; top: 20px; right: 20px;
    background: rgba(255, 255, 255, .95);
    -webkit-backdrop-filter: blur(6px);
    backdrop-filter: blur(6px);
    padding: 12px 16px; border-radius: 4px;
    display: flex; gap: 10px; align-items: center;
    z-index: 2;
    box-shadow: 0 4px 12px rgba(0, 0, 0, .1);
    max-width: 220px;
  }
  .icon { font-size: 18px; color: var(--color-red); }
  .text {
    font-family: var(--font-mono); font-size: 10px;
    letter-spacing: .06em; line-height: 1.4;
    color: var(--color-ink); text-transform: uppercase;
  }
</style>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/primitives/
git commit -m "feat: add Button, Kicker, PhotoCard, HeritageBadge primitives"
```

---

## Phase 7 — Section components

Each section task follows the same shape: type its props off the content schema, render the HTML, commit. Every section below uses `Extract<z.infer<typeof homeSectionSchema>, { section: 'X' }>` for its props.

### Task 12: Hero section (with countdown)

**Files:**
- Create: `src/components/sections/Hero.astro`

- [ ] **Step 1: Write `Hero.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import Button from '~/components/primitives/Button.astro';
import PhotoCard from '~/components/primitives/PhotoCard.astro';
import HeritageBadge from '~/components/primitives/HeritageBadge.astro';

interface Props {
  eyebrow: string;
  headline: string;
  headlineAccent: string;
  subtitle: string;
  cta1: { label: string; href: string };
  cta2: { label: string; href: string };
  countdownLabel: string;
  heroTag: string;
  heroCaption: string;
  heroImage: string;
  heritageText: string;
}
const { eyebrow, headline, headlineAccent, subtitle, cta1, cta2,
  countdownLabel, heroTag, heroCaption, heroImage, heritageText } = Astro.props;
---
<section class="hero">
  <div class="grid">
    <div class="left">
      <div class="eyebrow-row">
        <span class="dot" aria-hidden="true"></span>
        <Kicker>{eyebrow}</Kicker>
      </div>
      <h1>{headline} <em>{headlineAccent}</em></h1>
      <p class="sub">{subtitle}</p>
      <div class="ctas">
        <Button href={cta1.href} variant="primary">{cta1.label}</Button>
        <Button href={cta2.href} variant="ghost">{cta2.label}</Button>
      </div>
      <div class="countdown">
        <span class="days"><em data-countdown-days>—</em></span>
        <span>{countdownLabel}</span>
      </div>
    </div>
    <div class="right">
      <PhotoCard image={heroImage} tag={heroTag} caption={heroCaption}>
        <HeritageBadge text={heritageText} />
      </PhotoCard>
    </div>
  </div>
</section>

<script is:inline>
  (function () {
    const target = new Date('2027-04-02T00:00:00+02:00').getTime();
    const el = document.querySelector('[data-countdown-days]');
    if (!el) return;
    const days = Math.max(0, Math.floor((target - Date.now()) / 86400000));
    el.textContent = String(days);
  })();
</script>

<style>
  .hero { padding: 64px 0 100px; position: relative; overflow: hidden; }
  .grid {
    max-width: 1320px; margin: 0 auto; padding: 0 40px;
    display: grid; grid-template-columns: 1.15fr .85fr;
    gap: 56px; align-items: end;
  }
  h1 {
    font-size: clamp(56px, 8.8vw, 138px);
    line-height: .94; letter-spacing: -0.025em; font-weight: 500;
  }
  h1 em {
    font-style: italic; color: var(--color-red);
    font-family: var(--font-display); font-weight: 500;
  }
  .eyebrow-row { display: flex; gap: 18px; align-items: center; margin-bottom: 28px; }
  .dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--color-red);
    box-shadow: 0 0 0 0 rgba(200, 32, 58, .6);
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(200,32,58,.45); }
    70%  { box-shadow: 0 0 0 14px rgba(200,32,58,0); }
    100% { box-shadow: 0 0 0 0 rgba(200,32,58,0); }
  }
  .sub {
    margin-top: 28px; font-size: clamp(17px, 1.4vw, 21px);
    color: var(--color-ink-2); max-width: 56ch; line-height: 1.45;
  }
  .ctas { margin-top: 36px; display: flex; gap: 12px; flex-wrap: wrap; }
  .countdown {
    margin-top: 44px; padding-top: 24px;
    border-top: 1px solid var(--color-rule);
    display: flex; gap: 24px; align-items: baseline; flex-wrap: wrap;
    font-family: var(--font-mono); font-size: 13px; color: var(--color-ink-2);
  }
  .days {
    font-family: var(--font-display);
    font-size: 40px; color: var(--color-ink); line-height: 1;
  }
  .days em { font-style: italic; color: var(--color-red); }
  .right { min-height: 460px; }
  @media (max-width: 980px) {
    .grid { grid-template-columns: 1fr; padding: 0 20px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Hero.astro
git commit -m "feat: add Hero section with live countdown"
```

---

### Task 13: TickerStrip section

**Files:**
- Create: `src/components/sections/TickerStrip.astro`

- [ ] **Step 1: Write `TickerStrip.astro`**

```astro
---
interface Props {
  tokens: { text: string; emphasized?: boolean }[];
}
const { tokens } = Astro.props;
// Duplicate tokens so the scroll loop is seamless
const doubled = [...tokens, ...tokens];
---
<section class="ticker" aria-hidden="true">
  <div class="track">
    {doubled.map(token => token.emphasized
      ? <b>{token.text}</b>
      : <span>{token.text}</span>
    )}
    {doubled.map(() => <span class="sep">·</span>)}
  </div>
</section>

<style>
  .ticker {
    border-top: 1px solid var(--color-rule);
    border-bottom: 1px solid var(--color-rule);
    background: var(--color-paper-2);
    overflow: hidden; padding: 18px 0;
  }
  .track {
    display: flex; gap: 48px; white-space: nowrap;
    animation: slide 60s linear infinite;
    font-family: var(--font-display); font-style: italic;
    font-size: clamp(22px, 2.6vw, 34px);
  }
  .track span { color: var(--color-ink); }
  .track b { color: var(--color-red); font-weight: 500; font-style: normal; }
  .track .sep { opacity: .3; }
  @keyframes slide {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/TickerStrip.astro
git commit -m "feat: add ticker strip section"
```

---

### Task 14: StatsGrid section

**Files:**
- Create: `src/components/sections/StatsGrid.astro`

- [ ] **Step 1: Write `StatsGrid.astro`**

```astro
---
interface Props { items: { value: string; label: string }[]; }
const { items } = Astro.props;
---
<section class="stats">
  <div class="container">
    <div class="grid">
      {items.map(s => (
        <div class="stat">
          <div class="value">{s.value}</div>
          <div class="label">{s.label}</div>
        </div>
      ))}
    </div>
  </div>
</section>

<style>
  .stats { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 48px; }
  .value {
    font-family: var(--font-display);
    font-size: clamp(48px, 6.8vw, 96px);
    line-height: .95; letter-spacing: -0.02em;
    color: var(--color-ink);
  }
  .label {
    margin-top: 12px;
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--color-muted);
  }
  @media (max-width: 800px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 720px) { .container { padding: 0 20px; } .stats { padding: 80px 0; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/StatsGrid.astro
git commit -m "feat: add stats grid section"
```

---

### Task 15: AboutSection

**Files:**
- Create: `src/components/sections/AboutSection.astro`

- [ ] **Step 1: Write `AboutSection.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';

interface Props {
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  facts: { label: string; value: string }[];
}
const { kicker, title, body, bullets, facts } = Astro.props;
---
<section class="about" id="about">
  <div class="container">
    <div class="grid">
      <div class="left">
        <Kicker>{kicker}</Kicker>
        <h2>{title}</h2>
        <p class="body">{body}</p>
        <ul class="bullets">
          {bullets.map(b => <li>{b}</li>)}
        </ul>
      </div>
      <aside class="side">
        <div class="seal" aria-hidden="true">
          <svg viewBox="0 0 200 200" class="seal-svg">
            <defs>
              <path id="sealArc" d="M 100,100 m -82,0 a 82,82 0 1,1 164,0 a 82,82 0 1,1 -164,0" />
            </defs>
            <text class="seal-text">
              <textPath href="#sealArc">TASTATUR UND MAUS · e.V. · GEMEINNÜTZIG · SINCE 2008 · </textPath>
            </text>
          </svg>
          <div class="core">TUM</div>
        </div>
        <dl class="facts">
          {facts.map(f => (
            <div class="fact">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  </div>
</section>

<style>
  .about { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .grid { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: start; }
  h2 {
    font-size: clamp(36px, 5vw, 72px);
    margin-top: 24px;
  }
  .body { margin-top: 28px; font-size: clamp(16px, 1.15vw, 19px); max-width: 60ch; color: var(--color-ink-2); line-height: 1.55; }
  .bullets { margin-top: 28px; padding-left: 0; list-style: none; }
  .bullets li {
    padding-left: 28px; position: relative; color: var(--color-ink-2);
    line-height: 1.5; margin: 10px 0;
  }
  .bullets li::before {
    content: "→"; position: absolute; left: 0;
    color: var(--color-red); font-family: var(--font-mono);
  }
  .side {
    position: sticky; top: 100px;
    background: var(--color-paper-2);
    padding: 32px; border-radius: 4px;
    border: 1px solid var(--color-rule);
  }
  .seal {
    position: relative; width: 200px; height: 200px;
    margin: 0 auto 24px;
  }
  .seal-svg { width: 100%; height: 100%; animation: rotate 30s linear infinite; }
  @keyframes rotate { to { transform: rotate(360deg); } }
  .seal-text {
    font-family: var(--font-mono); font-size: 9px;
    letter-spacing: .2em; fill: var(--color-ink);
  }
  .seal .core {
    position: absolute; inset: 0;
    display: grid; place-items: center;
    font-family: var(--font-display); font-style: italic;
    font-size: 36px; color: var(--color-red);
  }
  .facts { display: flex; flex-direction: column; gap: 14px; margin: 0; }
  .fact { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--color-rule); padding-bottom: 10px; }
  .fact:last-child { border-bottom: none; }
  .fact dt {
    font-family: var(--font-mono); font-size: 11px;
    letter-spacing: .14em; text-transform: uppercase;
    color: var(--color-muted);
  }
  .fact dd { margin: 0; font-family: var(--font-display); font-size: 16px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .side { position: static; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/AboutSection.astro
git commit -m "feat: add about section with rotating seal and facts"
```

---

### Task 16: RevisionSection

**Files:**
- Create: `src/components/sections/RevisionSection.astro`

- [ ] **Step 1: Write `RevisionSection.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import type { Locale } from '~/i18n';

interface Props {
  kicker: string;
  title: string;
  body: string;
  meta: { dates: string; venue: string; audience: string; edition: string };
  ctaLabel: string;
  ctaHref: string;
  locale: Locale;
}
const { kicker, title, body, meta, ctaLabel, ctaHref, locale } = Astro.props;

const LABELS: Record<Locale, Record<'dates' | 'venue' | 'audience' | 'edition', string>> = {
  en: { dates: 'Dates', venue: 'Venue', audience: 'Audience', edition: 'Edition' },
  de: { dates: 'Termin', venue: 'Ort', audience: 'Publikum', edition: 'Ausgabe' },
};
const lbl = LABELS[locale];
---
<section class="revision" id="revision">
  <div class="container">
    <div class="card">
      <Kicker>{kicker}</Kicker>
      <h3>{title}</h3>
      <p class="body">{body}</p>
      <div class="meta">
        <div><dt>{lbl.dates}</dt><dd>{meta.dates}</dd></div>
        <div><dt>{lbl.venue}</dt><dd>{meta.venue}</dd></div>
        <div><dt>{lbl.audience}</dt><dd>{meta.audience}</dd></div>
        <div><dt>{lbl.edition}</dt><dd>{meta.edition}</dd></div>
      </div>
      <a href={ctaHref} class="link">{ctaLabel}</a>
    </div>
  </div>
</section>

<style>
  .revision { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .card {
    background: var(--color-ink); color: var(--color-paper);
    padding: 80px; border-radius: 4px;
  }
  h3 { font-size: clamp(36px, 5vw, 72px); color: var(--color-paper); margin-top: 20px; }
  .body { margin-top: 28px; font-size: clamp(16px, 1.15vw, 19px); max-width: 60ch; color: var(--color-rule); line-height: 1.55; }
  .meta {
    margin-top: 48px;
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px;
    padding-top: 28px; border-top: 1px solid rgba(255,255,255,.15);
  }
  .meta dt {
    font-family: var(--font-mono); font-size: 10px;
    letter-spacing: .18em; text-transform: uppercase;
    color: var(--color-muted);
  }
  .meta dd {
    margin: 6px 0 0; font-family: var(--font-display);
    font-size: 18px; color: var(--color-paper);
  }
  .link {
    margin-top: 28px; display: inline-block;
    font-family: var(--font-display); font-style: italic;
    font-size: 22px; color: var(--color-red);
    text-decoration: none;
  }
  .link:hover { color: var(--color-paper); }
  @media (max-width: 900px) { .meta { grid-template-columns: repeat(2, 1fr); } .card { padding: 40px 24px; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/RevisionSection.astro
git commit -m "feat: add Revision event section"
```

---

### Task 17: HistoryTimeline section

**Files:**
- Create: `src/components/sections/HistoryTimeline.astro`

- [ ] **Step 1: Write `HistoryTimeline.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import { getCollection } from 'astro:content';
import { getLocale, type Locale } from '~/i18n';

interface Props {
  kicker: string;
  title: string;
  locale: Locale;
}
const { kicker, title, locale } = Astro.props;

const entries = await getCollection('history', e => e.id.startsWith(`${locale}/`));
const items = entries[0]?.data.items ?? [];
---
<section class="history" id="history">
  <div class="container">
    <Kicker>{kicker}</Kicker>
    <h2>{title}</h2>
    <ol class="timeline">
      {items.map(i => (
        <li class="item">
          <div class="bar" aria-hidden="true"></div>
          <div class="year">{i.year}</div>
          <h4 class="t">{i.title}</h4>
          <p class="d">{i.description}</p>
        </li>
      ))}
    </ol>
  </div>
</section>

<style>
  .history { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  h2 { font-size: clamp(36px, 5vw, 72px); margin-top: 24px; }
  .timeline {
    list-style: none; padding: 0; margin: 48px 0 0;
    display: grid; grid-template-columns: repeat(6, 1fr); gap: 24px;
  }
  .item { position: relative; padding-top: 12px; }
  .bar {
    position: absolute; top: 0; left: 0;
    width: 0; height: 3px; background: var(--color-red);
    transition: width .25s ease;
  }
  .item:hover .bar { width: 100%; }
  .year { font-family: var(--font-display); font-size: 40px; }
  .t { font-size: 16px; font-family: var(--font-display); font-weight: 500; margin-top: 10px; }
  .d { margin-top: 10px; font-size: 14px; color: var(--color-ink-2); line-height: 1.45; }
  @media (max-width: 1100px) { .timeline { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 600px)  { .timeline { grid-template-columns: repeat(2, 1fr); } .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/HistoryTimeline.astro
git commit -m "feat: add history timeline section"
```

---

### Task 18: SponsorsPitch section

**Files:**
- Create: `src/components/sections/SponsorsPitch.astro`

- [ ] **Step 1: Write `SponsorsPitch.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import Button from '~/components/primitives/Button.astro';

interface Props {
  kicker: string;
  title: string;
  body: string;
  audienceFacts: { label: string; value: string }[];
  ctaLabel: string;
  ctaHref: string;
}
const { kicker, title, body, audienceFacts, ctaLabel, ctaHref } = Astro.props;
---
<section class="pitch" id="sponsors">
  <div class="container">
    <Kicker>{kicker}</Kicker>
    <h2>{title}</h2>
    <div class="grid">
      <p class="body">{body}</p>
      <aside class="card">
        <dl class="facts">
          {audienceFacts.map(f => (
            <div class="fact">
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
    <div class="cta-row">
      <Button href={ctaHref} variant="primary">{ctaLabel}</Button>
    </div>
  </div>
</section>

<style>
  .pitch { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  h2 { font-size: clamp(36px, 5vw, 72px); margin-top: 24px; max-width: 20ch; }
  .grid { margin-top: 48px; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 48px; align-items: start; }
  .body { font-size: clamp(16px, 1.15vw, 19px); color: var(--color-ink-2); line-height: 1.55; max-width: 60ch; }
  .card {
    background: var(--color-paper-2); padding: 32px; border-radius: 4px;
    border: 1px solid var(--color-rule);
    position: sticky; top: 100px;
  }
  .facts { display: flex; flex-direction: column; gap: 14px; margin: 0; }
  .fact { display: flex; justify-content: space-between; gap: 20px; border-bottom: 1px solid var(--color-rule); padding-bottom: 10px; }
  .fact:last-child { border-bottom: none; }
  .fact dt { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--color-muted); }
  .fact dd { margin: 0; font-family: var(--font-display); font-size: 18px; }
  .cta-row { margin-top: 48px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .card { position: static; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/SponsorsPitch.astro
git commit -m "feat: add sponsors pitch section"
```

---

### Task 19: SponsorTiers section

**Files:**
- Create: `src/components/sections/SponsorTiers.astro`

- [ ] **Step 1: Write `SponsorTiers.astro`**

```astro
---
import { getCollection } from 'astro:content';
import type { Locale } from '~/i18n';

interface Props { locale: Locale; }
const { locale } = Astro.props;

const entries = await getCollection('sponsors', e => e.id.startsWith(`${locale}/`));
const tiers = entries[0]?.data.tiers ?? [];
---
<section class="tiers">
  <div class="container">
    <div class="grid">
      {tiers.map(t => (
        <article class={`tier ${t.highlight ? 'highlight' : ''}`}>
          {t.highlight && <span class="badge">{t.highlightLabel}</span>}
          <h3 class="name">{t.name}</h3>
          <div class="price">{t.price}</div>
          <ul class="perks">
            {t.perks.map(p => <li>{p}</li>)}
          </ul>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .tiers { padding: 0 0 120px; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .tier {
    background: var(--color-paper-2); padding: 32px;
    border-radius: 4px; border: 1px solid var(--color-rule);
    position: relative; display: flex; flex-direction: column;
  }
  .tier.highlight { background: var(--color-ink); color: var(--color-paper); border-color: var(--color-ink); }
  .tier.highlight .name { color: var(--color-paper); }
  .tier.highlight .price { color: var(--color-rule); }
  .tier.highlight .perks li { color: var(--color-rule); }
  .tier.highlight .perks li::before { color: var(--color-red); }
  .badge {
    position: absolute; top: 20px; right: 20px;
    background: var(--color-red); color: #fff;
    font-family: var(--font-mono); font-size: 10px;
    letter-spacing: .14em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 999px;
  }
  .name { font-family: var(--font-display); font-size: 36px; font-weight: 500; }
  .price { font-family: var(--font-mono); font-size: 13px; color: var(--color-muted); margin-top: 6px; }
  .perks { list-style: none; padding: 0; margin: 24px 0 0; flex: 1; }
  .perks li {
    padding-left: 28px; position: relative; margin: 12px 0;
    color: var(--color-ink-2); line-height: 1.4;
  }
  .perks li::before {
    content: "+"; position: absolute; left: 0;
    color: var(--color-red); font-family: var(--font-mono);
  }
  @media (max-width: 1000px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 640px)  { .grid { grid-template-columns: 1fr; } .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/SponsorTiers.astro
git commit -m "feat: add sponsor tiers grid with highlighted Gold"
```

---

### Task 20: SponsorWall section

**Files:**
- Create: `src/components/sections/SponsorWall.astro`

- [ ] **Step 1: Write `SponsorWall.astro` (uses placeholder logos by name for v1)**

```astro
---
// Placeholder sponsor wall for v1 — 12 company-name tiles.
// Real logos arrive with v1.1.
const placeholders = [
  'Acme Systems', 'Byteforge', 'Cathode Labs', 'DemoTronic',
  'Eigen', 'Framebuffer Co.', 'Glitchworks', 'Hextile',
  'Initialize', 'Jittercore', 'Kernel Foundry', 'Luminor',
];
---
<section class="wall">
  <div class="grid" aria-label="Sponsor wall placeholder">
    {placeholders.map(name => <div class="logo">{name}</div>)}
  </div>
</section>

<style>
  .wall {
    border-top: 1px solid var(--color-rule);
    border-bottom: 1px solid var(--color-rule);
  }
  .grid {
    max-width: 1320px; margin: 0 auto;
    display: grid; grid-template-columns: repeat(6, 1fr);
  }
  .logo {
    border-right: 1px solid var(--color-rule);
    border-bottom: 1px solid var(--color-rule);
    aspect-ratio: 3 / 2;
    display: grid; place-items: center;
    font-family: var(--font-display); font-size: 18px;
    color: var(--color-muted); letter-spacing: .02em;
    transition: color .2s, background .2s;
  }
  .logo:hover { color: var(--color-ink); background: var(--color-paper-2); }
  @media (max-width: 1000px) { .grid { grid-template-columns: repeat(3, 1fr); } }
  @media (max-width: 600px)  { .grid { grid-template-columns: repeat(2, 1fr); } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/SponsorWall.astro
git commit -m "feat: add placeholder sponsor wall"
```

---

### Task 21: Gallery section

**Files:**
- Create: `src/components/sections/Gallery.astro`

- [ ] **Step 1: Write `Gallery.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';

interface Props {
  kicker: string;
  title: string;
  tiles: { image: string; caption: string; span: '7x3' | '5x2' | '4x2' }[];
}
const { kicker, title, tiles } = Astro.props;

const spanClass = (s: string) => `span-${s.replace('x', '-')}`;
---
<section class="gallery" id="gallery">
  <div class="container">
    <Kicker>{kicker}</Kicker>
    <h2>{title}</h2>
    <div class="grid">
      {tiles.map(t => (
        <figure class={`tile ${spanClass(t.span)}`} style={`background-image: url('${t.image}')`}>
          <figcaption>{t.caption}</figcaption>
        </figure>
      ))}
    </div>
  </div>
</section>

<style>
  .gallery { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  h2 { font-size: clamp(36px, 5vw, 72px); margin-top: 24px; }
  .grid {
    margin-top: 48px;
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 20px;
  }
  .tile {
    position: relative;
    background-size: cover; background-position: center;
    border-radius: 4px; min-height: 220px;
    overflow: hidden;
  }
  .tile::after {
    content: ""; position: absolute; inset: 0;
    background: linear-gradient(to top, rgba(20,19,26,.65) 0%, rgba(20,19,26,0) 40%);
  }
  .tile figcaption {
    position: absolute; left: 16px; bottom: 14px; z-index: 1;
    color: #fff; font-family: var(--font-mono); font-size: 10px;
    letter-spacing: .14em; text-transform: uppercase;
  }
  .span-7-3 { grid-column: span 7; grid-row: span 3; min-height: 460px; }
  .span-5-2 { grid-column: span 5; grid-row: span 2; min-height: 300px; }
  .span-4-2 { grid-column: span 4; grid-row: span 2; min-height: 240px; }
  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
    .tile { grid-column: span 1 !important; grid-row: span 1 !important; min-height: 220px; }
    .container { padding: 0 20px; }
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/Gallery.astro
git commit -m "feat: add editorial gallery grid section"
```

---

### Task 22: PressKit section

**Files:**
- Create: `src/components/sections/PressKit.astro`

- [ ] **Step 1: Write `PressKit.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';

interface Props {
  kicker: string;
  title: string;
  body: string;
  files: { name: string; meta: string; href: string }[];
}
const { kicker, title, body, files } = Astro.props;
---
<section class="press" id="press">
  <div class="container">
    <div class="grid">
      <div class="left">
        <Kicker>{kicker}</Kicker>
        <h2>{title}</h2>
        <p class="body">{body}</p>
      </div>
      <ul class="files">
        {files.map(f => (
          <li><a href={f.href} class="row">
            <span class="name">{f.name}</span>
            <span class="meta">{f.meta}</span>
            <span class="arr">↓</span>
          </a></li>
        ))}
      </ul>
    </div>
  </div>
</section>

<style>
  .press { padding: 120px 0; background: var(--color-paper-2); }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
  h2 { font-size: clamp(36px, 5vw, 72px); margin-top: 24px; max-width: 14ch; }
  .body { margin-top: 28px; font-size: clamp(16px, 1.15vw, 19px); color: var(--color-ink-2); line-height: 1.55; max-width: 50ch; }
  .files { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; }
  .row {
    display: grid; grid-template-columns: 1fr auto auto;
    align-items: baseline; gap: 20px;
    padding: 18px 0; border-bottom: 1px solid var(--color-rule);
    text-decoration: none; color: var(--color-ink);
    transition: padding-left .2s, color .2s;
  }
  .files li:first-child .row { border-top: 1px solid var(--color-rule); }
  .row:hover { padding-left: 12px; color: var(--color-red); }
  .name { font-family: var(--font-display); font-size: 22px; }
  .meta { font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; text-transform: uppercase; color: var(--color-muted); }
  .arr { font-family: var(--font-mono); font-size: 14px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/PressKit.astro
git commit -m "feat: add press kit section"
```

---

### Task 23: News section

**Files:**
- Create: `src/components/sections/News.astro`

- [ ] **Step 1: Write `News.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import { getCollection } from 'astro:content';
import type { Locale } from '~/i18n';

interface Props {
  kicker: string;
  title: string;
  locale: Locale;
}
const { kicker, title, locale } = Astro.props;

const entries = await getCollection('news', e => e.id.startsWith(`${locale}/`));
const articles = entries.sort((a, b) => a.data.order - b.data.order).slice(0, 3);
---
<section class="news">
  <div class="container">
    <Kicker>{kicker}</Kicker>
    <h2>{title}</h2>
    <div class="grid">
      {articles.map(a => (
        <article class="card">
          <div class="top">
            <time>{a.data.date}</time>
            <span class="tag">{a.data.tag}</span>
          </div>
          <h4>{a.data.title}</h4>
          <p>{a.data.excerpt}</p>
          <span class="more">{locale === 'en' ? 'Read more →' : 'Weiterlesen →'}</span>
        </article>
      ))}
    </div>
  </div>
</section>

<style>
  .news { padding: 120px 0; }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  h2 { font-size: clamp(36px, 5vw, 72px); margin-top: 24px; }
  .grid { margin-top: 48px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
  .card { display: flex; flex-direction: column; gap: 12px; }
  .top { display: flex; justify-content: space-between; font-family: var(--font-mono); font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--color-muted); }
  .card h4 { font-family: var(--font-display); font-size: 28px; font-weight: 500; line-height: 1.1; margin: 4px 0 0; }
  .card p { font-size: 15px; color: var(--color-ink-2); line-height: 1.55; }
  .more { color: var(--color-red); font-family: var(--font-display); font-style: italic; font-size: 15px; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/News.astro
git commit -m "feat: add news section with content collection"
```

---

### Task 24: ContactSection

**Files:**
- Create: `src/components/sections/ContactSection.astro`

- [ ] **Step 1: Write `ContactSection.astro`**

```astro
---
import Kicker from '~/components/primitives/Kicker.astro';
import Button from '~/components/primitives/Button.astro';

interface Props {
  kicker: string;
  title: string;
  channels: { label: string; email: string }[];
  address: string;
  cardHeading: string;
  cardBody: string;
  cardCtaLabel: string;
  cardCtaHref: string;
}
const { kicker, title, channels, address, cardHeading, cardBody, cardCtaLabel, cardCtaHref } = Astro.props;
const addressLines = address.split('\n');
---
<section class="contact" id="contact">
  <div class="container">
    <div class="grid">
      <div class="left">
        <Kicker>{kicker}</Kicker>
        <h2>{title}</h2>
        <dl class="channels">
          {channels.map(c => (
            <div class="row">
              <dt>{c.label}</dt>
              <dd><a href={`mailto:${c.email}`}>{c.email}</a></dd>
            </div>
          ))}
        </dl>
        <address class="addr">
          {addressLines.map(l => <div>{l}</div>)}
        </address>
      </div>
      <aside class="card">
        <div class="bubble" aria-hidden="true"></div>
        <h3>{cardHeading}</h3>
        <p>{cardBody}</p>
        <Button href={cardCtaHref} variant="primary">{cardCtaLabel}</Button>
      </aside>
    </div>
  </div>
</section>

<style>
  .contact { padding: 120px 0; background: var(--color-ink); color: var(--color-paper); }
  .container { max-width: 1320px; margin: 0 auto; padding: 0 40px; }
  .grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 64px; align-items: start; }
  h2 { font-size: clamp(36px, 5vw, 72px); color: var(--color-paper); margin-top: 24px; }
  .channels { margin-top: 32px; display: flex; flex-direction: column; gap: 18px; }
  .row { display: grid; grid-template-columns: 120px 1fr; gap: 20px; align-items: baseline; border-bottom: 1px solid rgba(255,255,255,.15); padding-bottom: 14px; }
  .row dt { font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; text-transform: uppercase; color: var(--color-muted); }
  .row dd { margin: 0; }
  .row dd a { color: #fff; font-family: var(--font-display); font-style: italic; font-size: 26px; text-decoration: none; }
  .row dd a:hover { color: #f7a0ad; }
  .addr { margin-top: 32px; font-family: var(--font-mono); font-size: 13px; color: var(--color-rule); font-style: normal; line-height: 1.6; }
  .card {
    position: relative; padding: 40px;
    background: var(--color-red); border-radius: 4px;
    overflow: hidden;
  }
  .bubble {
    position: absolute; inset: -40px -40px auto auto;
    width: 220px; height: 220px; border-radius: 50%;
    background: rgba(255,255,255,.08);
  }
  .card h3 { color: #fff; font-family: var(--font-display); font-size: 32px; position: relative; }
  .card p { color: rgba(255,255,255,.85); margin-top: 18px; line-height: 1.55; position: relative; }
  .card :global(.btn) { margin-top: 24px; position: relative; background: #fff !important; color: var(--color-red) !important; }
  .card :global(.btn:hover) { background: var(--color-paper) !important; }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; gap: 40px; } }
  @media (max-width: 720px) { .container { padding: 0 20px; } }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/ContactSection.astro
git commit -m "feat: add contact section with sponsor CTA card"
```

---

## Phase 8 — Pages and dispatcher

### Task 25: Write the section dispatcher and home pages

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/de/index.astro`

- [ ] **Step 1: Write `src/pages/en/index.astro`**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '~/layouts/BaseLayout.astro';
import Hero from '~/components/sections/Hero.astro';
import TickerStrip from '~/components/sections/TickerStrip.astro';
import StatsGrid from '~/components/sections/StatsGrid.astro';
import AboutSection from '~/components/sections/AboutSection.astro';
import RevisionSection from '~/components/sections/RevisionSection.astro';
import HistoryTimeline from '~/components/sections/HistoryTimeline.astro';
import SponsorsPitch from '~/components/sections/SponsorsPitch.astro';
import SponsorTiers from '~/components/sections/SponsorTiers.astro';
import SponsorWall from '~/components/sections/SponsorWall.astro';
import Gallery from '~/components/sections/Gallery.astro';
import PressKit from '~/components/sections/PressKit.astro';
import News from '~/components/sections/News.astro';
import ContactSection from '~/components/sections/ContactSection.astro';

const locale = 'en' as const;
const entries = (await getCollection('home', e => e.id.startsWith('en/')))
  .sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Tastatur und Maus e.V. — We love computer art." locale={locale}>
  {entries.map(e => {
    switch (e.data.section) {
      case 'hero':          return <Hero {...e.data} />;
      case 'ticker':        return <TickerStrip {...e.data} />;
      case 'stats':         return <StatsGrid {...e.data} />;
      case 'about':         return <AboutSection {...e.data} />;
      case 'revision':      return <RevisionSection {...e.data} locale={locale} />;
      case 'history':       return <HistoryTimeline {...e.data} locale={locale} />;
      case 'sponsorsPitch': return (
        <>
          <SponsorsPitch {...e.data} />
          <SponsorTiers locale={locale} />
          <SponsorWall />
        </>
      );
      case 'gallery':       return <Gallery {...e.data} />;
      case 'press':         return <PressKit {...e.data} />;
      case 'news':          return <News {...e.data} locale={locale} />;
      case 'contact':       return <ContactSection {...e.data} />;
    }
  })}
</BaseLayout>
```

- [ ] **Step 2: Write `src/pages/de/index.astro`**

Same as EN but with `locale = 'de'`, the German title, and filter `'de/'`:

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '~/layouts/BaseLayout.astro';
import Hero from '~/components/sections/Hero.astro';
import TickerStrip from '~/components/sections/TickerStrip.astro';
import StatsGrid from '~/components/sections/StatsGrid.astro';
import AboutSection from '~/components/sections/AboutSection.astro';
import RevisionSection from '~/components/sections/RevisionSection.astro';
import HistoryTimeline from '~/components/sections/HistoryTimeline.astro';
import SponsorsPitch from '~/components/sections/SponsorsPitch.astro';
import SponsorTiers from '~/components/sections/SponsorTiers.astro';
import SponsorWall from '~/components/sections/SponsorWall.astro';
import Gallery from '~/components/sections/Gallery.astro';
import PressKit from '~/components/sections/PressKit.astro';
import News from '~/components/sections/News.astro';
import ContactSection from '~/components/sections/ContactSection.astro';

const locale = 'de' as const;
const entries = (await getCollection('home', e => e.id.startsWith('de/')))
  .sort((a, b) => a.data.order - b.data.order);
---
<BaseLayout title="Tastatur und Maus e.V. — Wir lieben Computer-Kunst." locale={locale}>
  {entries.map(e => {
    switch (e.data.section) {
      case 'hero':          return <Hero {...e.data} />;
      case 'ticker':        return <TickerStrip {...e.data} />;
      case 'stats':         return <StatsGrid {...e.data} />;
      case 'about':         return <AboutSection {...e.data} />;
      case 'revision':      return <RevisionSection {...e.data} locale={locale} />;
      case 'history':       return <HistoryTimeline {...e.data} locale={locale} />;
      case 'sponsorsPitch': return (
        <>
          <SponsorsPitch {...e.data} />
          <SponsorTiers locale={locale} />
          <SponsorWall />
        </>
      );
      case 'gallery':       return <Gallery {...e.data} />;
      case 'press':         return <PressKit {...e.data} />;
      case 'news':          return <News {...e.data} locale={locale} />;
      case 'contact':       return <ContactSection {...e.data} />;
    }
  })}
</BaseLayout>
```

- [ ] **Step 3: Run the first full build**

```bash
npm run build
```
Expected: build succeeds, `dist/en/index.html` and `dist/de/index.html` exist. No `dist/index.html`.

```bash
ls dist/
ls dist/en/ dist/de/
```
Expected: no `index.html` at `dist/` root (because there's no `src/pages/index.astro`); `index.html` present in both `dist/en/` and `dist/de/`.

- [ ] **Step 4: Visual smoke via preview**

```bash
npm run preview &
sleep 2
curl -sI http://localhost:4321/en/ | head -1
curl -sI http://localhost:4321/de/ | head -1
kill %1
```
Expected: both return `HTTP/1.1 200 OK`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/en/index.astro src/pages/de/index.astro
git commit -m "feat: wire home page section dispatcher for both locales"
```

---

### Task 26: Stub imprint, privacy, code-of-conduct pages + bilingual 404

**Files:**
- Create: `src/pages/en/imprint.astro`
- Create: `src/pages/en/privacy.astro`
- Create: `src/pages/en/code-of-conduct.astro`
- Create: `src/pages/de/imprint.astro`
- Create: `src/pages/de/privacy.astro`
- Create: `src/pages/de/code-of-conduct.astro`
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write `src/pages/en/imprint.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="Imprint — Tastatur und Maus e.V." locale="en">
  <article class="legal-page">
    <h1>Imprint</h1>
    <p><strong>Tastatur und Maus e.V.</strong></p>
    <p>c/o Vorstand<br />66111 Saarbrücken<br />Germany</p>
    <p>Email: <a href="mailto:info@tastatur-und-maus.net">info@tastatur-und-maus.net</a></p>
    <p>Registered as a non-profit association (e.V.) at Amtsgericht Saarbrücken.</p>
    <p><em>Full imprint content pending — placeholder for v1.</em></p>
  </article>
</BaseLayout>

<style>
  .legal-page { max-width: 720px; margin: 80px auto; padding: 0 40px; }
  h1 { font-size: clamp(40px, 5vw, 64px); margin-bottom: 32px; }
  p { margin: 14px 0; line-height: 1.55; color: var(--color-ink-2); }
  a { color: var(--color-red); }
</style>
```

- [ ] **Step 2: Write `src/pages/en/privacy.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="Privacy — Tastatur und Maus e.V." locale="en">
  <article class="legal-page">
    <h1>Privacy</h1>
    <p>This website is statically generated and self-hosted. We do not set tracking cookies or run analytics.</p>
    <p>Fonts, images, and all other assets are served from our own infrastructure — no third-party CDN requests.</p>
    <p>Contact form submissions (when enabled) are processed only for the purpose of answering your enquiry.</p>
    <p><em>Full privacy policy pending — placeholder for v1.</em></p>
  </article>
</BaseLayout>

<style>
  .legal-page { max-width: 720px; margin: 80px auto; padding: 0 40px; }
  h1 { font-size: clamp(40px, 5vw, 64px); margin-bottom: 32px; }
  p { margin: 14px 0; line-height: 1.55; color: var(--color-ink-2); }
</style>
```

- [ ] **Step 3: Write `src/pages/en/code-of-conduct.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="Code of Conduct — Tastatur und Maus e.V." locale="en">
  <article class="legal-page">
    <h1>Code of Conduct</h1>
    <p>Revision is a welcoming space for creators of all backgrounds. We expect everyone — attendees, speakers, volunteers, sponsors — to treat each other with respect.</p>
    <p>Harassment of any kind will not be tolerated. If you experience or witness it, please reach out to <a href="mailto:safety@tastatur-und-maus.net">safety@tastatur-und-maus.net</a>.</p>
    <p><em>Full code of conduct pending — placeholder for v1.</em></p>
  </article>
</BaseLayout>

<style>
  .legal-page { max-width: 720px; margin: 80px auto; padding: 0 40px; }
  h1 { font-size: clamp(40px, 5vw, 64px); margin-bottom: 32px; }
  p { margin: 14px 0; line-height: 1.55; color: var(--color-ink-2); }
  a { color: var(--color-red); }
</style>
```

- [ ] **Step 4: Write the three German equivalents**

Mirror the three files above into `src/pages/de/`. Translate headings and body:
- `imprint.astro` → "Impressum", body with "Eingetragener gemeinnütziger Verein…"
- `privacy.astro` → "Datenschutz", body: "Diese Website wird statisch generiert und auf eigener Infrastruktur gehostet. Wir setzen keine Tracking-Cookies und betreiben keine Analyse-Tools. Schriftarten, Bilder und alle weiteren Assets werden aus eigener Hand ausgeliefert — keine CDN-Anfragen an Dritte."
- `code-of-conduct.astro` → "Verhaltenskodex", body: "Revision ist ein offener Raum für kreative Menschen aller Hintergründe. Wir erwarten, dass sich alle — Besuchende, Vortragende, Helfende und Sponsoren — respektvoll begegnen. Belästigung wird nicht toleriert. Meldungen an safety@tastatur-und-maus.net."

Use the same `<BaseLayout>` structure with `locale="de"`.

- [ ] **Step 5: Write `src/pages/404.astro`**

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout title="Not found / Nicht gefunden" locale="en">
  <article class="nf">
    <h1>404</h1>
    <p class="en">This page does not exist. Return to the <a href="/en/">home page</a>.</p>
    <p class="de">Diese Seite existiert nicht. Zurück zur <a href="/de/">Startseite</a>.</p>
  </article>
</BaseLayout>

<style>
  .nf { max-width: 640px; margin: 120px auto; padding: 0 40px; text-align: center; }
  h1 { font-size: clamp(80px, 14vw, 180px); color: var(--color-red); }
  p { margin: 20px 0; font-size: 18px; color: var(--color-ink-2); }
  p a { color: var(--color-red); }
</style>
```

- [ ] **Step 6: Build and verify**

```bash
npm run build
ls dist/en/ dist/de/ dist/
```
Expected: both locale folders have `imprint/index.html`, `privacy/index.html`, `code-of-conduct/index.html`; `dist/404.html` exists.

- [ ] **Step 7: Commit**

```bash
git add src/pages/en/imprint.astro src/pages/en/privacy.astro src/pages/en/code-of-conduct.astro src/pages/de/imprint.astro src/pages/de/privacy.astro src/pages/de/code-of-conduct.astro src/pages/404.astro
git commit -m "feat: add legal stub pages and bilingual 404"
```

---

## Phase 9 — SEO baseline

### Task 27: robots.txt

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Write `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://tastatur-und-maus.net/sitemap-index.xml
```

- [ ] **Step 2: Verify sitemap emits in build**

```bash
npm run build
ls dist/ | grep sitemap
```
Expected: `sitemap-0.xml`, `sitemap-index.xml`.

- [ ] **Step 3: Inspect sitemap has both locales**

```bash
grep -o '<loc>[^<]*</loc>' dist/sitemap-0.xml | head
```
Expected: both `/en/` and `/de/` URLs present.

- [ ] **Step 4: Commit**

```bash
git add public/robots.txt
git commit -m "feat: add robots.txt pointing to sitemap-index"
```

---

## Phase 10 — Dev-time E2E smoke test

### Task 28: Playwright smoke

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`

- [ ] **Step 1: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4321/en/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true } },
  ],
});
```

- [ ] **Step 3: Write `tests/e2e/smoke.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('EN homepage renders key content', async ({ page }) => {
  await page.goto('/en/');
  await expect(page.locator('h1')).toContainText('computer art');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('DE homepage renders key content', async ({ page }) => {
  await page.goto('/de/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
});

test('countdown shows an integer', async ({ page }) => {
  await page.goto('/en/');
  const days = await page.locator('[data-countdown-days]').textContent();
  expect(days).toMatch(/^\d+$/);
  expect(parseInt(days!, 10)).toBeGreaterThan(0);
});

test('language toggle swaps prefix', async ({ page }) => {
  await page.goto('/en/imprint/');
  await page.getByRole('link', { name: /Switch to German/i }).click();
  await expect(page).toHaveURL(/\/de\/imprint\//);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  test('hamburger toggle reveals drawer links', async ({ page }) => {
    await page.goto('/en/');
    await page.locator('label.mnav-btn').click();
    await expect(page.locator('.mnav-drawer a').first()).toBeVisible();
  });
});

test('no /index.html at dist root (nginx handles /)', async ({ request }) => {
  const res = await request.get('/');
  // astro preview serves 404 for unknown paths; this is the behavior we want
  expect([404, 301, 302]).toContain(res.status());
});
```

- [ ] **Step 4: Run the smoke**

```bash
npm run test:e2e
```
Expected: all tests pass. If Playwright complains about already-running preview, kill stray node processes first.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "test: add Playwright smoke covering locales, countdown, drawer"
```

---

## Phase 11 — Deployment assets

### Task 29: Dockerfile

**Files:**
- Create: `Dockerfile`

- [ ] **Step 1: Write `Dockerfile`**

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

- [ ] **Step 2: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile (node build -> nginx serve)"
```

---

### Task 30: nginx.conf with Accept-Language redirect

**Files:**
- Create: `nginx.conf`

- [ ] **Step 1: Write `nginx.conf`**

```nginx
# DE only when the browser's PRIMARY preference starts with "de". Any other
# preference order falls through to EN. Proper q-weight parsing is beyond
# what nginx map can do — this is a deliberate simplification.
map $http_accept_language $tum_pref_lang {
    default                 en;
    ~*^de(-|,|;|$)          de;
}

server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Language-aware root redirect (only matches "/").
    location = / {
        add_header Vary "Accept-Language" always;
        return 302 /$tum_pref_lang/;
    }

    # Clean URLs.
    location / {
        try_files $uri $uri/ $uri/index.html =404;
    }

    # Custom 404 page.
    error_page 404 /404.html;

    # Cache static assets.
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # HTML pages cache shorter.
    location ~* \.html$ {
        expires 1h;
        add_header Cache-Control "public";
    }

    # Security headers.
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Block hidden files (except .well-known).
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

- [ ] **Step 2: Build image locally and test redirect**

```bash
docker build -t tum-website-test .
docker run --rm -p 8080:80 -d --name tum-test tum-website-test
sleep 1

# English-preferred browser → /en/
curl -sI -H 'Accept-Language: en-US,en;q=0.9' http://localhost:8080/ | head -5

# German-preferred browser → /de/
curl -sI -H 'Accept-Language: de-DE,de;q=0.9,en;q=0.5' http://localhost:8080/ | head -5

# Mixed — English primary → /en/
curl -sI -H 'Accept-Language: fr;q=1.0, de;q=0.01' http://localhost:8080/ | head -5

docker stop tum-test
```
Expected:
- English headers → `HTTP/1.1 302`, `Location: /en/`
- German primary → `HTTP/1.1 302`, `Location: /de/`
- French primary with low-weight de → `HTTP/1.1 302`, `Location: /en/`

- [ ] **Step 3: Commit**

```bash
git add nginx.conf
git commit -m "feat: add nginx.conf with Accept-Language redirect"
```

---

### Task 31: GitHub Actions deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Write `.github/workflows/deploy.yml`**

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Docker Hub
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Build and push
        uses: docker/build-push-action@v6
        if: github.event_name != 'pull_request'
        with:
          context: .
          push: true
          tags: |
            dfox288/tastatur-und-maus:${{ github.sha }}
            dfox288/tastatur-und-maus:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Trigger k8s deploy
        if: github.event_name != 'pull_request'
        env:
          PRIVATE_KEY: ${{ secrets.TUM_WEBSITES_K8S_PRIVATE_KEY }}
        run: |
          mkdir -p ~/.ssh
          echo "$PRIVATE_KEY" > ~/.ssh/id_ed25519
          chmod 600 ~/.ssh/id_ed25519
          ssh-keyscan github.com >> ~/.ssh/known_hosts

          git config --global user.email "info@tastatur-und-maus.net"
          git config --global user.name "${{ github.repository_owner }}"

          git clone git@github.com:dfox288/tum-cluster-tum-websites_k8s.git /tmp/k8s
          cd /tmp/k8s

          sed -i "s|dfox288/tastatur-und-maus:.*|dfox288/tastatur-und-maus:${{ github.sha }}|" \
            tastatur-und-maus.net/*-deployment.yaml

          git add -A
          git commit -m "deploy dfox288/tastatur-und-maus:${{ github.sha }}"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat: add deploy workflow (Docker Hub + k8s manifest bump)"
```

---

## Phase 12 — Housekeeping

### Task 32: Write README and v1.1 TODO

**Files:**
- Create: `README.md`
- Create: `docs/TODO.md`
- Create: `LICENSE`

- [ ] **Step 1: Write `README.md`**

```markdown
# tastatur-und-maus.net

Public website for Tastatur und Maus e.V. — the non-profit that organises Revision, the Easter demoparty in Saarbrücken. Bilingual (EN/DE).

## Stack
- Astro v6, Tailwind CSS v4, TypeScript
- Content in Markdown via Astro content collections (`src/content/`)
- Deployed via Docker + nginx to self-hosted k8s

## Scripts
- `npm run dev` — Astro dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — preview the built site
- `npm run test` — Vitest unit tests (i18n helpers)
- `npm run test:e2e` — Playwright smoke
- `npm run typecheck` — Astro + TS checks
- `npm run fetch:unsplash` — re-download placeholder images
- `npm run migrate:content` — rebuild content MD from design handoff

## Architecture
See `docs/superpowers/specs/2026-04-18-tum-website-design.md` for the v1 design decisions. Follow-ups in `docs/TODO.md`.

## Deployment
Pushes to `main` build `dfox288/tastatur-und-maus:${SHA}` on Docker Hub, then bump the image tag in the `dfox288/tum-cluster-tum-websites_k8s` manifest repo. ArgoCD reconciles the change.
```

- [ ] **Step 2: Write `docs/TODO.md`**

```markdown
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
```

- [ ] **Step 3: Write `LICENSE`** (copy from reference repo's pattern — permissive for content/brand, MIT for code; or just state "All rights reserved — Tastatur und Maus e.V." for v1)

```
Copyright © 2026 Tastatur und Maus e.V.

All rights reserved. Brand assets (logo, name, visual identity) are the
property of Tastatur und Maus e.V. Source code in this repository is
licensed under the MIT License:

MIT License — Copyright © 2026 Tastatur und Maus e.V.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

- [ ] **Step 4: Commit**

```bash
git add README.md docs/TODO.md LICENSE
git commit -m "docs: add README, v1.1 TODO, LICENSE"
```

---

## Phase 13 — Final verification

### Task 33: Full build + test pass

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

```bash
rm -rf dist node_modules/.astro .astro
npm run build
```
Expected: completes without warnings relevant to our code. Sitemap emits both locales.

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```
Expected: 0 errors.

- [ ] **Step 3: Unit tests**

```bash
npm run test
```
Expected: all pass.

- [ ] **Step 4: E2E smoke**

```bash
npm run test:e2e
```
Expected: all pass.

- [ ] **Step 5: Docker smoke**

```bash
docker build -t tum-website-test .
docker run --rm -p 8080:80 -d --name tum-test tum-website-test
sleep 1
curl -sI -H 'Accept-Language: de-DE' http://localhost:8080/ | head -5
curl -sI http://localhost:8080/en/ | head -5
curl -sI http://localhost:8080/de/ | head -5
curl -sI http://localhost:8080/en/imprint/ | head -5
curl -sI http://localhost:8080/does-not-exist | head -5
docker stop tum-test
```
Expected: `/` → 302 to `/de/`; `/en/`, `/de/`, `/en/imprint/` → 200; `/does-not-exist` → 404 (and body is the bilingual 404 page).

- [ ] **Step 6: Push to trigger deploy**

Only after the **blocking external work** from §13.4 of the spec is done:

```bash
git push origin main
```

Watch the GH Actions run. Confirm the image appears on Docker Hub and a commit lands in the manifest repo.

---

## End of plan

The above covers every section of the approved spec (`docs/superpowers/specs/2026-04-18-tum-website-design.md` rev 2). Any divergence found during implementation should be flagged, discussed, and reflected back into the spec before continuing.

**Task count:** 33 tasks across 13 phases.
