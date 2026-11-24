import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { canonicalLanguage, isTranslationKey, normalizeTranslations, resolveWidgetTranslations, widgetLanguageLabel } from '../../../features/widgets/translations.mjs';

function WidgetLanguages({ translations, languages = [], language, onLanguageChange, onChange }) {
  const [newLanguage, setNewLanguage] = useState('');
  const [newKey, setNewKey] = useState('');
  const [keyError, setKeyError] = useState('');
  const dictionaries = { en: {}, ...normalizeTranslations(translations) };
  const availableLanguages = languages.filter(item => {
    const tag = canonicalLanguage(item.iso2);
    return tag && !Object.hasOwn(dictionaries, tag);
  });
  const languageToAdd = availableLanguages.some(item => canonicalLanguage(item.iso2) === newLanguage) ? newLanguage : '';
  const selectedLanguage = Object.hasOwn(dictionaries, language) ? language : 'en';
  const dictionary = dictionaries[selectedLanguage];
  const keys = [...new Set(Object.values(dictionaries).flatMap(value => Object.keys(value)))].sort();
  const inheritedDictionaries = { ...dictionaries };
  delete inheritedDictionaries[selectedLanguage];
  const inherited = resolveWidgetTranslations(inheritedDictionaries, [selectedLanguage]).i18n;

  const addLanguage = event => {
    event.preventDefault();
    const tag = languageToAdd;
    if (!tag) return;
    onChange({ ...dictionaries, [tag]: {} });
    onLanguageChange(tag);
    setNewLanguage('');
  };

  const addKey = event => {
    event.preventDefault();
    const key = newKey.trim();
    if (!isTranslationKey(key)) return setKeyError('Start with a letter or underscore, then use letters, numbers, or underscores. Reserved names are not allowed.');
    if (keys.includes(key)) return setKeyError('This translation key already exists.');
    onChange({ ...dictionaries, en: { ...dictionaries.en, [key]: '' } });
    setNewKey('');
    setKeyError('');
  };

  const updateValue = (key, value) => {
    const next = { ...dictionary };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange({ ...dictionaries, [selectedLanguage]: next });
  };

  const removeLanguage = () => {
    if (!window.confirm(`Remove all ${widgetLanguageLabel(selectedLanguage, languages)} translations from this widget?`)) return;
    const next = { ...dictionaries };
    delete next[selectedLanguage];
    onChange(next);
    onLanguageChange('en');
  };

  const removeKey = key => {
    if (!window.confirm(`Remove "${key}" from every language? Update any template references to this key as well.`)) return;
    onChange(Object.fromEntries(Object.entries(dictionaries).map(([tag, values]) => {
      const next = { ...values };
      delete next[key];
      return [tag, next];
    })));
  };

  return <div>
    <p className="text-secondary">Define text once in English, then add translations. Use <code>{'{{i18n.yourKey}}'}</code> in titles, editable labels, descriptions, or HTML content, replacing <code>yourKey</code> with any key you define below. Layout, queries, and scripts are shared by every language.</p>
    <div className="row align-items-end mb-3">
      <div className="col-sm-6 mb-2">
        <label className="form-label" htmlFor="widget-translation-language">Language</label>
        <div className="d-flex gap-2">
          <select id="widget-translation-language" className="form-select" style={{ minWidth: 0 }} value={selectedLanguage} onChange={event => onLanguageChange(event.target.value)}>
            {Object.keys(dictionaries).map(tag => <option key={tag} value={tag}>{widgetLanguageLabel(tag, languages)}{tag === 'en' ? ' — default' : ''}</option>)}
          </select>
          {selectedLanguage !== 'en' && <button type="button" className="btn btn-outline-danger flex-shrink-0" onClick={removeLanguage}>Remove language</button>}
        </div>
      </div>
      <div className="col-sm-6 mb-2">
        <form onSubmit={addLanguage}>
          <label className="form-label" htmlFor="widget-new-language">Add language</label>
          <div className="d-flex gap-2">
            <select id="widget-new-language" className="form-select" style={{ minWidth: 0 }} value={languageToAdd} onChange={event => setNewLanguage(event.target.value)} disabled={!availableLanguages.length}>
              <option value="">{availableLanguages.length ? 'Select a language' : 'No languages available to add'}</option>
              {availableLanguages.map(item => {
                const tag = canonicalLanguage(item.iso2);
                return <option key={tag} value={tag}>{widgetLanguageLabel(tag, languages)}</option>;
              })}
            </select>
            <button type="submit" className="btn btn-outline-primary flex-shrink-0" disabled={!languageToAdd}>Add language</button>
          </div>
        </form>
      </div>
    </div>
    <form onSubmit={addKey} className="mb-3">
      <label className="form-label" htmlFor="widget-new-translation-key">New translation key</label>
      <div className="d-flex gap-2">
        <input id="widget-new-translation-key" className={`form-control ${keyError ? 'is-invalid' : ''}`} value={newKey} placeholder="statusLabel" onChange={event => { setNewKey(event.target.value); setKeyError(''); }} aria-invalid={!!keyError} aria-describedby={keyError ? 'widget-key-error' : undefined} />
        <button type="submit" className="btn btn-outline-primary flex-shrink-0">Add key</button>
      </div>
      {keyError && <div id="widget-key-error" className="text-danger mt-1" role="alert">{keyError}</div>}
    </form>
    {!keys.length && <div className="text-secondary py-3">No translation keys yet. Add a key, enter its English text, then add another language.</div>}
    {keys.map(key => {
      const hasValue = Object.hasOwn(dictionary, key);
      return <div key={key} className="border rounded p-3 mb-3">
        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
          <label className="form-label mb-0" style={{ minWidth: 0 }} htmlFor={`widget-translation-${key}`}><code style={{ overflowWrap: 'anywhere', whiteSpace: 'normal' }}>{`{{i18n.${key}}}`}</code></label>
          <button type="button" className="btn btn-sm btn-ghost-danger flex-shrink-0" onClick={() => removeKey(key)} aria-label={`Remove translation key ${key}`}>Remove key</button>
        </div>
        {selectedLanguage !== 'en' && <>
          <div className="text-secondary mb-2" style={{ whiteSpace: 'pre-wrap' }}>English: {dictionaries.en[key] ?? '(not defined)'}</div>
          <label className="form-check mb-2">
            <input type="checkbox" className="form-check-input" checked={!hasValue} onChange={event => updateValue(key, event.target.checked ? undefined : inherited[key] ?? '')} />
            <span className="form-check-label">Use fallback text for {key}</span>
          </label>
        </>}
        <textarea id={`widget-translation-${key}`} className="form-control" rows={3} lang={selectedLanguage} dir="auto" aria-label={`${key} (${selectedLanguage})`} disabled={selectedLanguage !== 'en' && !hasValue} value={hasValue ? dictionary[key] : inherited[key] ?? ''} onChange={event => updateValue(key, event.target.value)} />
        {selectedLanguage !== 'en' && !hasValue && <div className="form-hint">Uses a broader language translation when available, then English.</div>}
      </div>;
    })}
    <p className="form-hint">Missing translations use fallback text. An explicitly empty translation stays empty. Use Save to save all languages with this widget.</p>
    <p className="form-hint mb-0">In iframe scripts, access translations through <code>window.widgetContext.i18n</code> after <code>onDataReady(context)</code> runs.</p>
  </div>;
}

WidgetLanguages.propTypes = {
  translations: PropTypes.object,
  languages: PropTypes.arrayOf(PropTypes.shape({ iso2: PropTypes.string.isRequired, name: PropTypes.string.isRequired })),
  language: PropTypes.string.isRequired,
  onLanguageChange: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired
};

export default React.memo(WidgetLanguages);
