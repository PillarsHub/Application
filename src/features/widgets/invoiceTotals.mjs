import { orderTotals } from './orderPage.mjs';

export const invoiceTotalDefinitions = [
  { id: 'itemsTotal', label: 'Items Total', visible: false },
  { id: 'subTotal', label: 'Subtotal', visible: true },
  { id: 'discount', label: 'Discount', visible: true },
  { id: 'shipping', label: 'Shipping', visible: true },
  { id: 'tax', label: 'Tax', visible: true }
];

// Only these rows can be configured. Unknown or duplicate IDs from imported
// settings cannot move Invoice Total or introduce extra totals.
export function getInvoiceTotalSettings(settings) {
  const configured = Array.isArray(settings?.invoiceTotals) ? settings.invoiceTotals : [];
  const rows = [];
  const seen = new Set();
  for (const row of [...configured, ...invoiceTotalDefinitions]) {
    const definition = invoiceTotalDefinitions.find(item => item.id === row?.id);
    if (!definition || seen.has(definition.id)) continue;
    seen.add(definition.id);
    rows.push({
      id: definition.id,
      label: typeof row.label === 'string' ? row.label : definition.label,
      visible: typeof row.visible === 'boolean' ? row.visible : definition.visible
    });
  }
  return rows;
}

export function getInvoiceTotalRows(order, settings) {
  const totals = orderTotals(order);
  const values = {
    itemsTotal: totals.itemsTotal,
    subTotal: totals.subTotal,
    discount: -Number(order?.discount ?? 0),
    shipping: Number(order?.shipping ?? 0),
    tax: Number(order?.tax ?? 0)
  };
  return getInvoiceTotalSettings(settings)
    .filter(row => row.visible && (row.id !== 'discount' || values.discount !== 0))
    .map(row => {
      const defaultLabel = invoiceTotalDefinitions.find(item => item.id === row.id).label;
      const label = row.label.trim() || defaultLabel;
      return {
        id: row.id,
        label: row.id === 'tax' && order?.taxRate > 0 ? `${label} (${order.taxRate} %)` : label,
        value: values[row.id],
        className: row.id === 'discount' ? 'text-danger' : ''
      };
    });
}
