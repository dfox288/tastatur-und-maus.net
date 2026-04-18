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
