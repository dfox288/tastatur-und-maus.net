export type Locale = 'en' | 'de';

export const LOCALES: Locale[] = ['en', 'de'];
export const DEFAULT_LOCALE: Locale = 'en';

export const NAV = {
  en: {
    about: 'Association',
    revision: 'Revision',
    history: 'History',
    sponsors: 'Sponsors',
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
    daysToGo: 'days to go',
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
    daysToGo: 'Tage noch',
  },
} as const satisfies Record<Locale, Record<string, string>>;
