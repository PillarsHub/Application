import { resolvePageUrl } from './orderPage.mjs';

const systemPageNames = new Map([['CSDB', 'Customer Details'], ['customer', 'Customer Details'], ['PDB', 'Dashboard'], ['dashboard', 'Dashboard'], ['orders', 'Orders'], ['earnings', 'Earnings'], ['order-detail', 'Order Details']]);

export function pageHeaderName(page) {
  return page?.name || systemPageNames.get(page?.id) || 'Current page';
}

export function isPageHeaderBackgroundTransparent(widget) {
  if (typeof widget?.settings?.transparentBackground === 'boolean') return widget.settings.transparentBackground;
  return ![widget?.headerColor, widget?.backgroundColor].some(color => typeof color === 'string' && color.trim() && color.trim().toLowerCase() !== 'transparent');
}

export function pageHeaderBreadcrumbSettings(settings, hasOrder = false) {
  const defaults = [
    ...(hasOrder ? [{ id: 'order-history', label: 'Order History', link: '/customers/{customerId}/orders' }] : []),
    { id: 'current-page', label: '{pageName}', link: '' }
  ];
  const rows = Array.isArray(settings?.breadcrumbs) ? settings.breadcrumbs : defaults;
  return rows.filter(row => row && typeof row === 'object').map((row, index) => ({
    id: typeof row.id === 'string' && row.id ? row.id : `breadcrumb-${index}`,
    label: typeof row.label === 'string' ? row.label : '',
    link: typeof row.link === 'string' ? row.link : ''
  }));
}

export function pageHeaderBreadcrumbs(settings, { customerId, orderId, page }) {
  if (settings?.showBreadcrumbs === false) return [];
  const values = { customerId, orderId, pageName: pageHeaderName(page) };
  return pageHeaderBreadcrumbSettings(settings, Boolean(orderId)).map(row => {
    const label = row.label.replace(/\{(customerId|orderId|pageName)\}/g, (_, key) => values[key] ?? '').trim();
    let link = resolvePageUrl(row.link.trim(), customerId, orderId) || null;
    if (link) {
      try {
        const url = new URL(link, 'https://page.invalid/');
        if (!['http:', 'https:'].includes(url.protocol) || /\{[^}]*\}/.test(link)) link = null;
      } catch {
        link = null;
      }
    }
    return { id: row.id, label, link };
  }).filter(row => row.label);
}
