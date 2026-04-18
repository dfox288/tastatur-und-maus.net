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
