import en from './locales/en.js';
import ru from './locales/ru.js';
import es from './locales/es.js';
import ptBR from './locales/pt-BR.js';
import de from './locales/de.js';

export const FALLBACK_LOCALE = 'en';
export const LANGUAGE_STORAGE_KEY = 'fugu-merge-language';
export const LANGUAGE_CHANGED_EVENT = 'bloop:language-changed';

export const LANGUAGE_OPTIONS = Object.freeze([
  Object.freeze({ locale: 'en', label: 'English' }),
  Object.freeze({ locale: 'ru', label: 'Русский' }),
  Object.freeze({ locale: 'es', label: 'Español' }),
  Object.freeze({ locale: 'pt-BR', label: 'Português (Brasil)' }),
  Object.freeze({ locale: 'de', label: 'Deutsch' }),
]);

export const TRANSLATIONS = Object.freeze({
  en,
  ru,
  es,
  'pt-BR': ptBR,
  de,
});

const warnedMissingKeys = new Set();
const languageListeners = new Set();

function normalizeLocale(locale) {
  const language = String(locale || '').toLowerCase();
  if (language.startsWith('ru')) return 'ru';
  if (language.startsWith('es')) return 'es';
  if (language.startsWith('pt')) return 'pt-BR';
  if (language.startsWith('de')) return 'de';
  if (language.startsWith('en')) return 'en';
  return null;
}

function readSavedLocale() {
  try {
    return normalizeLocale(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

function detectSystemLocale() {
  if (typeof navigator === 'undefined') return FALLBACK_LOCALE;
  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ];
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return FALLBACK_LOCALE;
}

let currentLocale = readSavedLocale() || detectSystemLocale();

function interpolate(template, params) {
  return String(template).replace(/\{(\w+)\}/g, (match, name) => (
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  ));
}

function warnMissingTranslation(key) {
  if (warnedMissingKeys.has(key)) return;
  warnedMissingKeys.add(key);
  const isDevelopment = typeof location !== 'undefined'
    && (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  if (isDevelopment) console.warn('[i18n] Missing translation: ' + currentLocale + '.' + key);
}

export function getLocale() {
  return currentLocale;
}

export function getLanguageLabel(locale = currentLocale) {
  return LANGUAGE_OPTIONS.find((option) => option.locale === locale)?.label || locale;
}

export function t(key, params = {}) {
  const currentValue = TRANSLATIONS[currentLocale]?.[key];
  const fallbackValue = TRANSLATIONS[FALLBACK_LOCALE]?.[key];
  const value = currentValue ?? fallbackValue;
  if (value === undefined) {
    warnMissingTranslation(key);
    return key;
  }
  if (currentValue === undefined) warnMissingTranslation(key);
  return interpolate(value, params);
}

// Готовая поддержка множественных форм без привязки к английскому count === 1.
export function tp(key, count, params = {}) {
  const category = new Intl.PluralRules(currentLocale).select(count);
  const localizedKey = TRANSLATIONS[currentLocale]?.[key + '.' + category] !== undefined
    ? key + '.' + category
    : key + '.other';
  return t(localizedKey, { ...params, count: formatNumber(count) });
}

export function formatNumber(value) {
  return new Intl.NumberFormat(currentLocale).format(value);
}

export function applyTranslations(root = typeof document !== 'undefined' ? document : null) {
  if (!root?.querySelectorAll) return;

  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', t(element.dataset.i18nTitle));
  });
  root.querySelectorAll('[data-i18n-content]').forEach((element) => {
    element.setAttribute('content', t(element.dataset.i18nContent));
  });
  root.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.setAttribute('alt', t(element.dataset.i18nAlt));
  });

  if (typeof document !== 'undefined') document.documentElement.lang = currentLocale;
}

export function onLanguageChanged(listener) {
  languageListeners.add(listener);
  return () => languageListeners.delete(listener);
}

export function setLocale(locale, { persist = true } = {}) {
  const normalizedLocale = normalizeLocale(locale) || FALLBACK_LOCALE;
  if (persist) {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLocale);
    } catch {
      // Язык остаётся активным до перезагрузки, даже если localStorage недоступен.
    }
  }

  if (normalizedLocale === currentLocale) {
    applyTranslations();
    return currentLocale;
  }

  currentLocale = normalizedLocale;
  applyTranslations();
  languageListeners.forEach((listener) => listener(currentLocale));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGED_EVENT, {
      detail: Object.freeze({ locale: currentLocale }),
    }));
  }
  return currentLocale;
}

applyTranslations();
