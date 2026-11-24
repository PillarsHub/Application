import test from 'node:test';
import assert from 'node:assert/strict';
import { createWidgetText, defaultWidgetText, localizeWidget, widgetLabelKey } from './widgetText.mjs';
import { resolveWidgetTranslations } from './translations.mjs';
import { widgetLabelDefaults } from './widgetLabels.mjs';

test('fixed labels support defaults, literal overrides, translated overrides, and reset', () => {
  const widget = { settings: { labels: { orderDate: 'Purchase date', total: '{{i18n.customTotal}}' } } };
  const { i18n } = resolveWidgetTranslations({ en: { customTotal: 'Order total' }, fr: { customTotal: 'Total de la commande' } }, ['fr']);
  assert.equal(createWidgetText(widget, i18n)('Order Date'), 'Purchase date');
  assert.equal(createWidgetText(widget, i18n)('Total'), 'Total de la commande');
  assert.equal(createWidgetText(widget, i18n)('Status'), 'Status');
  delete widget.settings.labels.orderDate;
  assert.equal(createWidgetText(widget, i18n)('Order Date'), 'Order Date');
  widget.settings.labels.total = '';
  assert.equal(createWidgetText(widget, i18n)('Total'), '');
});

test('translated labels can reorder dynamic placeholders without evaluating inserted data', () => {
  const widget = { settings: { labels: { loadMoreCountLeft: '{{i18n.more}}' } } };
  const text = createWidgetText(widget, { more: '{count} restants : charger' });
  assert.equal(text('Load more ({count} left)', { count: 12 }), '12 restants : charger');
  assert.equal(text('Load more ({count} left)', { count: '{{i18n.secret}}' }), '{{i18n.secret}} restants : charger');
  assert.equal(defaultWidgetText('Order {orderId}', { orderId: 'O1' }), 'Order O1');
});

test('Card and Rank display text changes without altering source bindings, mapped values, or stored data', () => {
  for (const type of ['card', 'rank']) {
    const widget = { type, title: '{{i18n.heading}}', panes: [{ title: 'PersonalVolume', text: '{{i18n.term}}', description: '{{i18n.help}}', imageUrl: '#123456', values: [{ value: '0', text: '{{i18n.zero}}' }] }] };
    const before = JSON.stringify(widget);
    const translated = localizeWidget(widget, { heading: 'Volumes', term: 'Volume personnel', help: 'Description', zero: 'Aucun' });
    assert.equal(translated.panes[0].text, 'Volume personnel');
    assert.equal(translated.panes[0].description, 'Description');
    assert.deepEqual(translated.panes[0].values, [{ value: '0', text: 'Aucun' }]);
    assert.equal(translated.panes[0].title, 'PersonalVolume');
    assert.equal(translated.panes[0].imageUrl, '#123456');
    assert.equal(JSON.stringify(widget), before);
  }
});

test('Banner captions, Upline labels, and Earnings overrides preserve functional fields', () => {
  const pane = { title: 'sourceId', text: '{{i18n.label}}', description: '{{i18n.help}}', imageUrl: '/image.png' };
  for (const type of ['upline', 'earnings']) {
    const result = localizeWidget({ type, panes: [pane] }, { label: 'Libellé', help: 'Aide' });
    assert.equal(result.panes[0].text, 'Libellé');
    assert.equal(result.panes[0].title, 'sourceId');
    assert.equal(result.panes[0].imageUrl, '/image.png');
  }
  const banner = localizeWidget({ type: 'banner', panes: [{ ...pane, title: '{{i18n.heading}}' }] }, { heading: 'Bannière', label: 'Légende' });
  assert.equal(banner.panes[0].title, 'Bannière');
  assert.equal(banner.panes[0].text, 'Légende');
  assert.equal(banner.panes[0].imageUrl, '/image.png');
});

test('settings translate only designated display fields', () => {
  const settings = {
    columnTitle: '{{i18n.label}}', negativeBalanceMessage: '{{i18n.label}}',
    treeId: '{{i18n.label}}', orderDetailPageId: '{{i18n.label}}', showTotal: false,
    breadcrumbs: [{ id: 'crumb', label: '{{i18n.label}}', link: '/customers/{customerId}' }],
    invoiceTotals: [{ id: 'tax', label: '{{i18n.label}}', visible: false }]
  };
  const i18n = { label: 'Texte {amount}' };
  assert.equal(localizeWidget({ type: 'recruiter', settings }, i18n).settings.columnTitle, 'Texte {amount}');
  assert.equal(localizeWidget({ type: 'pending', settings }, i18n).settings.negativeBalanceMessage, 'Texte {amount}');
  const header = localizeWidget({ type: 'pageHeader', settings }, i18n);
  assert.deepEqual(header.settings.breadcrumbs, [{ id: 'crumb', label: 'Texte {amount}', link: '/customers/{customerId}' }]);
  const invoice = localizeWidget({ type: 'orderInvoice', settings }, i18n);
  assert.deepEqual(invoice.settings.invoiceTotals, [{ id: 'tax', label: 'Texte {amount}', visible: false }]);
  for (const widget of [header, invoice]) {
    assert.equal(widget.settings.treeId, '{{i18n.label}}');
    assert.equal(widget.settings.orderDetailPageId, '{{i18n.label}}');
    assert.equal(widget.settings.showTotal, false);
  }
  assert.equal(settings.breadcrumbs[0].label, '{{i18n.label}}');
});

test('HTML source, queries, scripts, and all unknown widget settings remain intact', () => {
  const widget = { type: 'html', panes: [{ title: 'query { customers { id } }', text: '<script>const label = "{{i18n.label}}";</script>', imageUrl: 'GQL' }], settings: { totalPath: 'customers/count', useIframe: true } };
  const result = localizeWidget(widget, { label: 'Translated' });
  assert.equal(result.panes, widget.panes);
  assert.deepEqual(result.settings, widget.settings);
});

test('every widget offers unique valid settings keys for its fixed labels', () => {
  for (const [type, labels] of Object.entries(widgetLabelDefaults)) {
    const keys = labels.map(widgetLabelKey);
    assert.equal(new Set(keys).size, keys.length, type);
    for (const key of keys) assert.match(key, /^[a-z][A-Za-z0-9]*$/);
  }
});
