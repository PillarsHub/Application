export const DEFAULT_WIDGET_LANGUAGE = 'en';

export function canonicalLanguage(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    // Locale extensions describe formatting preferences, not a separate translation.
    return new Intl.Locale(value.trim()).baseName;
  } catch {
    return null;
  }
}

export function widgetLanguageLabel(tag, languages = []) {
  const language = canonicalLanguage(tag);
  const configured = languages.find(item => canonicalLanguage(item.iso2) === language) ??
    languages.find(item => canonicalLanguage(item.iso2) === language?.split('-')[0]);
  const name = configured?.name || (language === 'en' ? 'English' : '');
  return name ? `${name} (${tag})` : tag;
}

export function isTranslationKey(value) {
  return typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_]*$/.test(value) &&
    !['__proto__', 'prototype', 'constructor'].includes(value);
}

export function translateWidgetTitle(title, i18n = {}) {
  if (typeof title !== 'string') return title;
  // Titles are rendered as React text, so leave escaping to React.
  return title.replace(/\{\{\s*i18n\.([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (_, key) =>
    isTranslationKey(key) && Object.hasOwn(i18n, key) ? i18n[key] : '');
}

export function normalizeTranslations(value) {
  const result = {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) return result;
  for (const [tag, dictionary] of Object.entries(value)) {
    const language = canonicalLanguage(tag);
    if (!language || !dictionary || typeof dictionary !== 'object' || Array.isArray(dictionary)) continue;
    result[language] = {
      ...result[language],
      ...Object.fromEntries(Object.entries(dictionary).filter(([key, text]) => isTranslationKey(key) && typeof text === 'string'))
    };
  }
  return result;
}

export function browserLanguages() {
  if (typeof navigator === 'undefined') return [DEFAULT_WIDGET_LANGUAGE];
  return navigator.languages?.length ? [...navigator.languages] : [navigator.language || DEFAULT_WIDGET_LANGUAGE];
}

export function languageFallbacks(preferences) {
  const candidates = [];
  for (const preference of preferences ?? []) {
    const language = canonicalLanguage(preference);
    if (!language) continue;
    const parts = language.split('-');
    while (parts.length) {
      candidates.push(parts.join('-'));
      parts.pop();
    }
  }
  return [...new Set([...candidates, DEFAULT_WIDGET_LANGUAGE])];
}

export function resolveWidgetTranslations(translations, preferences) {
  const dictionaries = normalizeTranslations(translations);
  const candidates = languageFallbacks(preferences);
  // A missing value inherits; an explicitly empty string remains empty.
  const i18n = Object.assign(Object.create(null), ...candidates.slice().reverse().map(tag => dictionaries[tag]));
  const language = candidates.find(tag => Object.hasOwn(dictionaries, tag)) ?? DEFAULT_WIDGET_LANGUAGE;
  return { i18n, language };
}
