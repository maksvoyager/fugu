import { TRANSLATIONS, FALLBACK_LOCALE } from '../src/i18n/index.js';

const referenceKeys = Object.keys(TRANSLATIONS[FALLBACK_LOCALE]).sort();
let hasErrors = false;

for (const [locale, translations] of Object.entries(TRANSLATIONS)) {
  if (locale === FALLBACK_LOCALE) continue;
  const localeKeys = Object.keys(translations).sort();
  const missing = referenceKeys.filter((key) => !localeKeys.includes(key));
  const extra = localeKeys.filter((key) => !referenceKeys.includes(key));
  if (!missing.length && !extra.length) continue;

  hasErrors = true;
  console.error('[i18n:' + locale + '] missing keys:', missing);
  console.error('[i18n:' + locale + '] extra keys:', extra);
}

if (hasErrors) process.exitCode = 1;
else console.log('[i18n] ' + referenceKeys.length + ' keys validated in '
  + Object.keys(TRANSLATIONS).length + ' locales.');
