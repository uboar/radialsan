import i18n from 'i18next';
import { derived, writable } from 'svelte/store';
import en from './locales/en.json';
import ja from './locales/ja.json';

type Locale = 'en' | 'ja';
type TranslationOptions = Record<string, string | number | boolean | null | undefined>;

function getInitialLanguage(): Locale {
  if (typeof localStorage === 'undefined') return 'ja';
  const stored = localStorage.getItem('radialsan-lang');
  if (stored === 'en' || stored === 'ja') return stored;
  return 'ja';
}

const initialLanguage = getInitialLanguage();

void i18n.init({
  resources: {
    en: { translation: en },
    ja: { translation: ja },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export const language = writable<Locale>(initialLanguage);

i18n.on('languageChanged', (lng) => {
  const locale: Locale = lng === 'ja' ? 'ja' : 'en';
  language.set(locale);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('radialsan-lang', locale);
  }
});

export const t = derived(language, () => {
  return (key: string, options?: TranslationOptions) => i18n.t(key, options) as string;
});

export function translate(key: string, options?: TranslationOptions): string {
  return i18n.t(key, options) as string;
}

export function changeLanguage(locale: Locale) {
  void i18n.changeLanguage(locale);
}

export default i18n;
