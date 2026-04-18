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
    const accentPattern = locale === 'en' ? / us\.$/ : / mit\.$/;
    const accent = locale === 'en' ? 'us.' : 'mit.';
    writeYaml(join(home, '01-hero.md'), {
      section: 'hero',
      order: 1,
      eyebrow: l.hero.eyebrow,
      headline: l.hero.headline.replace(accentPattern, ''),
      headlineAccent: accent,
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
        ? "Tell us who you are and what kind of partnership you're thinking of. We'll send the deck and set up a call."
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
          excerpt: "Four days, 1,100 attendees, and the strongest shader showdown final in years. Here's what happened.",
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
