#!/usr/bin/env node
// One-shot: downloads Unsplash placeholder imagery from the design handoff
// into public/images/. Will be replaced with real Revision photos in v1.1.
// Self-hosting eliminates runtime third-party requests (GDPR posture).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const outDir = join(repoRoot, 'public/images');

// Extracted from docs/design-handoff/assets/content.js (window.TUM_PHOTOS)
// and docs/design-handoff/site-a-editorial.html (hero).
const IMAGES = [
  { out: 'hero.jpg',       url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1600&q=80&auto=format&fit=crop' },
  { out: 'gallery-01.jpg', url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80&auto=format&fit=crop' },
  { out: 'gallery-02.jpg', url: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80&auto=format&fit=crop' },
  { out: 'gallery-03.jpg', url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80&auto=format&fit=crop' },
  { out: 'gallery-04.jpg', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80&auto=format&fit=crop' },
  { out: 'gallery-05.jpg', url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1600&q=80&auto=format&fit=crop' },
  { out: 'gallery-06.jpg', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=1200&q=80&auto=format&fit=crop' },
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
      licenseLines.push(`${img.out} <- ${img.url}`);
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
