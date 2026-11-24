import test from 'node:test';
import assert from 'node:assert/strict';
import Mustache from 'mustache';
import { canonicalLanguage, isTranslationKey, languageFallbacks, normalizeTranslations, resolveWidgetTranslations, translateWidgetTitle } from './translations.mjs';

test('language tags normalize casing and aliases, without treating formatting extensions as translations', () => {
  assert.equal(canonicalLanguage(' PT-br '), 'pt-BR');
  assert.equal(canonicalLanguage('iw'), 'he');
  assert.equal(canonicalLanguage('en-US-u-nu-latn'), 'en-US');
  assert.equal(canonicalLanguage('not a language'), null);
  assert.equal(canonicalLanguage(''), null);
});

test('language matching retains script distinctions and considers browser preferences before English', () => {
  assert.deepEqual(languageFallbacks(['zh-Hant-TW', 'fr-CA', 'fr']), ['zh-Hant-TW', 'zh-Hant', 'zh', 'fr-CA', 'fr', 'en']);
  const resolved = resolveWidgetTranslations({ en: { label: 'English' }, 'zh-Hans': { label: 'Simplified' }, fr: { label: 'French' } }, ['zh-Hant-TW', 'fr-CA']);
  assert.equal(resolved.language, 'fr');
  assert.equal(resolved.i18n.label, 'French');
});

test('each key inherits independently and explicit empty translations stay empty', () => {
  const translations = {
    en: { title: 'Orders', action: 'View', help: 'Help', empty: 'Default' },
    es: { title: 'Pedidos', action: 'Ver' },
    'es-MX': { action: 'Consultar', empty: '' }
  };
  const before = JSON.stringify(translations);
  const { i18n, language } = resolveWidgetTranslations(translations, ['es-MX']);
  assert.equal(language, 'es-MX');
  assert.deepEqual({ ...i18n }, { title: 'Pedidos', action: 'Consultar', help: 'Help', empty: '' });
  assert.equal(JSON.stringify(translations), before);
});

test('an explicit language only falls back within that language and English', () => {
  const translations = { en: { title: 'English' }, fr: { title: 'French' } };
  assert.equal(resolveWidgetTranslations(translations, ['es']).i18n.title, 'English');
  assert.equal(resolveWidgetTranslations(translations, ['es', 'fr']).i18n.title, 'French');
});

test('new shared English keys appear immediately without replacing existing translations', () => {
  const translations = { en: { action: 'Open', newLabel: 'New feature' }, es: { action: 'Abrir' } };
  assert.deepEqual({ ...resolveWidgetTranslations(translations, ['es']).i18n }, { action: 'Abrir', newLabel: 'New feature' });
});

test('legacy widgets and malformed translations resolve safely', () => {
  for (const translations of [undefined, null, [], 'text']) {
    const resolved = resolveWidgetTranslations(translations, ['es']);
    assert.equal(resolved.language, 'en');
    assert.deepEqual({ ...resolved.i18n }, {});
  }
  assert.deepEqual(normalizeTranslations({ EN: { title: 'English', number: 3 }, 'es-mx': { title: 'Spanish' }, bogus_locale: { title: 'Invalid' } }), {
    en: { title: 'English' }, 'es-MX': { title: 'Spanish' }
  });
});

test('template keys reject ambiguous paths and prototype names', () => {
  for (const key of ['statusLabel', '_label', 'label2']) assert.equal(isTranslationKey(key), true);
  for (const key of ['status.label', 'bad key', '1label', '__proto__', 'prototype', 'constructor']) assert.equal(isTranslationKey(key), false);
  const { i18n } = resolveWidgetTranslations(JSON.parse('{"en":{"__proto__":"unsafe","constructor":"unsafe","title":"Safe"}}'), ['en']);
  assert.equal(Object.getPrototypeOf(i18n), null);
  assert.equal(Mustache.render('{{i18n.constructor}} / {{i18n.title}}', { i18n }), ' / Safe');
});

test('translated HTML uses standard Mustache escaping and leaves customer bindings functional', () => {
  const { i18n } = resolveWidgetTranslations({ en: { title: 'Orders' }, es: { title: '<img src=x onerror=alert(1)>' } }, ['es']);
  const html = Mustache.render('<h3>{{i18n.title}}</h3><p>{{customer.fullName}}</p>', { i18n, customer: { fullName: 'Jane Doe' } });
  assert.equal(html, '<h3>&lt;img src&#x3D;x onerror&#x3D;alert(1)&gt;</h3><p>Jane Doe</p>');
});

test('titles resolve user-defined keys, including multiple keys and surrounding text', () => {
  const translations = {
    en: { myTestTitle: 'Example Title', anotherKey: 'Details' },
    fr: { myTestTitle: "Titre d'exemple", anotherKey: 'Détails' }
  };
  const { i18n } = resolveWidgetTranslations(translations, ['fr-FR']);
  assert.equal(translateWidgetTitle('{{i18n.myTestTitle}}', i18n), "Titre d'exemple");
  assert.equal(translateWidgetTitle('Page: {{i18n.anotherKey}} — {{ i18n.myTestTitle }}', i18n), "Page: Détails — Titre d'exemple");
});

test('title translations inherit English, preserve explicit emptiness, and do not change the stored template', () => {
  const widget = { title: '{{i18n.customHeading}}', translations: { en: { customHeading: 'Heading' }, fr: {} } };
  assert.equal(translateWidgetTitle(widget.title, resolveWidgetTranslations(widget.translations, ['fr']).i18n), 'Heading');
  assert.equal(widget.title, '{{i18n.customHeading}}');
  widget.translations.fr.customHeading = '';
  assert.equal(translateWidgetTitle(widget.title, resolveWidgetTranslations(widget.translations, ['fr']).i18n), '');
  assert.equal(translateWidgetTitle('{{i18n.missing}}', {}), '');
});

test('plain titles and non-translation braces are preserved; translations are returned as literal text', () => {
  assert.equal(translateWidgetTitle('Orders & Returns'), 'Orders & Returns');
  assert.equal(translateWidgetTitle('Report {2026} {{customer.name}}'), 'Report {2026} {{customer.name}}');
  assert.equal(translateWidgetTitle(undefined), undefined);
  assert.equal(translateWidgetTitle('{{i18n.myLabel}}', { myLabel: "<b>Titre d'exemple & détails</b> $& {{i18n.other}}" }), "<b>Titre d'exemple & détails</b> $& {{i18n.other}}");
});
