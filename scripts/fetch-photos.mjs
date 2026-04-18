#!/usr/bin/env node
// Fetch photos from the Revision photo archive at tf.weimarnetz.de.
// Photography credit: Viscid (vscd@npl.de).
//
// Usage:
//   node scripts/fetch-photos.mjs --year 2026 --list
//     Print every image URL for the given year (no download).
//   node scripts/fetch-photos.mjs --year 2026 --sample 10
//     Download 10 random images into public/images/revision-2026/.
//   node scripts/fetch-photos.mjs --year 2026 --names IMG_9500_DxO.jpg,IMG_9481_DxO.jpg
//     Download specific images by filename.
//
// Images land in public/images/revision-<year>/ with a CREDITS.txt
// alongside. They are NOT auto-wired into the gallery content —
// pick favourites and rename/copy into public/images/hero.jpg etc.
// to replace the Unsplash placeholders.

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');

function parseArgs(argv) {
  const args = { year: 2026, list: false, sample: 0, names: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      printHelp();
      process.exit(0);
    } else if (a === '--list') {
      args.list = true;
    } else if (a === '--year') {
      args.year = parseInt(argv[++i], 10);
    } else if (a === '--sample') {
      args.sample = parseInt(argv[++i], 10);
    } else if (a === '--names') {
      args.names = argv[++i].split(',').map(s => s.trim()).filter(Boolean);
    } else {
      console.error(`Unknown argument: ${a}`);
      printHelp();
      process.exit(1);
    }
  }
  return args;
}

function printHelp() {
  console.log(`
Fetch photos from the Revision photo archive at tf.weimarnetz.de.

Usage:
  node scripts/fetch-photos.mjs --year 2026 --list
  node scripts/fetch-photos.mjs --year 2026 --sample 10
  node scripts/fetch-photos.mjs --year 2026 --names IMG_9500_DxO.jpg,IMG_9481_DxO.jpg

Options:
  --year N        Revision year (default: 2026)
  --list          Print all available image URLs and exit (no download)
  --sample N      Download N random images
  --names a,b,c   Download specific images by filename (comma-separated)

Downloads land in public/images/revision-<year>/ with CREDITS.txt.
`);
}

async function listImages(year) {
  const base = `https://tf.weimarnetz.de/revision${year}/`;
  const res = await fetch(base);
  if (!res.ok) throw new Error(`Gallery fetch failed: ${base} returned ${res.status}`);
  const html = await res.text();
  // jAlbum output uses <a href="slides/IMG_####_DxO.jpg"> pattern
  const re = /href="(slides\/[^"]+\.(?:jpg|jpeg|png))"/gi;
  const matches = [...html.matchAll(re)].map(m => m[1]);
  return [...new Set(matches)];
}

async function downloadOne(year, slidePath, outDir) {
  const filename = slidePath.split('/').pop();
  const target = join(outDir, filename);
  if (existsSync(target)) {
    console.log(`skip  ${filename} (exists)`);
    return { filename, slidePath, skipped: true };
  }
  const url = `https://tf.weimarnetz.de/revision${year}/${slidePath}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${filename}: ${res.status} ${res.statusText}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(target, buf);
  console.log(`fetch ${filename} (${(buf.length / 1024).toFixed(0)} KB)`);
  return { filename, slidePath, skipped: false };
}

function pickSample(all, n) {
  const a = [...all];
  const out = [];
  while (a.length && out.length < n) {
    const i = Math.floor(Math.random() * a.length);
    out.push(a.splice(i, 1)[0]);
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);
  const all = await listImages(args.year);
  console.log(`Found ${all.length} images in /revision${args.year}/`);

  if (args.list) {
    all.forEach(p => console.log(`https://tf.weimarnetz.de/revision${args.year}/${p}`));
    return;
  }

  let toDownload = [];
  if (args.names.length > 0) {
    toDownload = args.names.map(name => {
      const found = all.find(p => p.endsWith('/' + name) || p === `slides/${name}`);
      if (!found) throw new Error(`Not found in archive: ${name}`);
      return found;
    });
  } else if (args.sample > 0) {
    toDownload = pickSample(all, args.sample);
  } else {
    console.log('\nNo download action specified. Pass one of:');
    console.log('  --list            print URLs and exit');
    console.log('  --sample N        download N random images');
    console.log('  --names a,b,c     download specific filenames');
    console.log('Run --help for full usage.');
    return;
  }

  const outDir = join(repoRoot, 'public/images', `revision-${args.year}`);
  mkdirSync(outDir, { recursive: true });

  const results = [];
  for (const slide of toDownload) {
    results.push(await downloadOne(args.year, slide, outDir));
  }

  const credits = [
    `Photography from Revision ${args.year}.`,
    `Source: https://tf.weimarnetz.de/revision${args.year}/`,
    `Credit: Viscid (vscd@npl.de) — Revision event photographer.`,
    `All images © their photographer; served here as part of the Revision photo archive.`,
    '',
    'Files:',
    ...results.map(r => `  ${r.filename}  ${r.skipped ? '(already present)' : ''}`.trimEnd()),
  ];
  writeFileSync(join(outDir, 'CREDITS.txt'), credits.join('\n') + '\n');
  console.log(`\nDone. ${results.length} image(s) in ${outDir}`);
  console.log('Attribution written to CREDITS.txt.');
}

main().catch(err => {
  console.error('\nError:', err.message);
  process.exit(1);
});
