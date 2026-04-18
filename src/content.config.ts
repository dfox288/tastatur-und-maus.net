import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
  attendeeWelcome: z.string().optional(),
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
  archiveNote: z.string().optional(),
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

const demosceneExplainer = z.object({
  section: z.literal('demosceneExplainer'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
});

const moneyBreakdown = z.object({
  section: z.literal('moneyBreakdown'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  items: z.array(z.string()).min(1),
});

const sponsorTiersMarker = z.object({
  section: z.literal('sponsorTiers'),
  order: z.number(),
});

const trustBlock = z.object({
  section: z.literal('trustBlock'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  items: z.array(z.string()).min(1),
});

const faq = z.object({
  section: z.literal('faq'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  items: z.array(z.object({
    q: z.string(),
    a: z.string(),
  })).min(1),
});

const pastSponsors = z.object({
  section: z.literal('pastSponsors'),
  order: z.number(),
  kicker: z.string(),
  title: z.string(),
  body: z.string(),
});

const sponsorWallMarker = z.object({
  section: z.literal('sponsorWall'),
  order: z.number(),
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
  hero, ticker, stats, about,
  demosceneExplainer,
  revision, history,
  sponsorsPitch, moneyBreakdown, sponsorTiersMarker, trustBlock, faq, pastSponsors, sponsorWallMarker,
  gallery, press, news, contact,
]);

export const collections = {
  home: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/home' }),
    schema: homeSectionSchema,
  }),
  sponsors: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/sponsors' }),
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
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/history' }),
    schema: z.object({
      items: z.array(z.object({
        year: z.string(),
        title: z.string(),
        description: z.string(),
      })).min(1),
    }),
  }),
  news: defineCollection({
    loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/news' }),
    schema: z.object({
      date: z.string(),
      tag: z.string(),
      title: z.string(),
      excerpt: z.string(),
      order: z.number(),
    }),
  }),
};
