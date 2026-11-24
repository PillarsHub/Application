import { translateWidgetTitle } from './translations.mjs';

// Settings keys stay independent of the text supplied by the customer.
export function widgetLabelKey(value) {
  const words = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').match(/[A-Za-z0-9]+/g) ?? [];
  return words.map((word, index) => index ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word.toLowerCase()).join('');
}

export function interpolateWidgetLabel(value, values = {}) {
  if (!value.includes('{')) return value;
  return value.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (match, key) =>
    Object.hasOwn(values, key) ? String(values[key] ?? '') : match);
}

export const defaultWidgetText = (value, values) => interpolateWidgetLabel(value, values);

export function createWidgetText(widget, i18n) {
  const labels = widget?.settings?.labels;
  const resolved = new Map();
  return (fallback, values) => {
    if (!resolved.has(fallback)) {
      const key = labels ? widgetLabelKey(fallback) : null;
      resolved.set(fallback, key && Object.hasOwn(labels, key) && typeof labels[key] === 'string' ? translateWidgetTitle(labels[key], i18n) : fallback);
    }
    return interpolateWidgetLabel(resolved.get(fallback), values);
  };
}

export function localizeWidget(widget, i18n) {
  if (!widget) return widget;
  const text = value => translateWidgetTitle(value, i18n);
  const next = { ...widget, title: text(widget.title) };
  const fields = {
    card: ['text', 'description'], rank: ['text', 'description'],
    banner: ['title', 'text', 'description'], upline: ['text'], earnings: ['text']
  }[widget.type];
  if (fields && Array.isArray(widget.panes)) {
    next.panes = widget.panes.map(pane => {
      const translated = { ...pane };
      for (const field of fields) if (typeof pane[field] === 'string') translated[field] = text(pane[field]);
      if (['card', 'rank'].includes(widget.type) && Array.isArray(pane.values)) {
        translated.values = pane.values.map(value => ({ ...value, text: text(value.text) }));
      }
      return translated;
    });
  }
  const settings = widget.settings;
  if (settings) {
    next.settings = { ...settings };
    if (widget.type === 'recruiter') next.settings.columnTitle = text(settings.columnTitle);
    if (widget.type === 'pending') next.settings.negativeBalanceMessage = text(settings.negativeBalanceMessage);
    if (widget.type === 'pageHeader' && Array.isArray(settings.breadcrumbs)) {
      next.settings.breadcrumbs = settings.breadcrumbs.map(row => ({ ...row, label: text(row.label) }));
    }
    if (widget.type === 'orderInvoice' && Array.isArray(settings.invoiceTotals)) {
      next.settings.invoiceTotals = settings.invoiceTotals.map(row => ({ ...row, label: text(row.label) }));
    }
  }
  return next;
}
