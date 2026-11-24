import { useEffect, useMemo, useState } from 'react';
import { browserLanguages, resolveWidgetTranslations } from '../translations.mjs';

export default function useWidgetTranslations(translations, language) {
  const [preferences, setPreferences] = useState(browserLanguages);
  useEffect(() => {
    const handleChange = () => setPreferences(browserLanguages());
    window.addEventListener('languagechange', handleChange);
    return () => window.removeEventListener('languagechange', handleChange);
  }, []);
  return useMemo(() => resolveWidgetTranslations(translations, language ? [language] : preferences), [translations, language, preferences]);
}
