export const ORDER_DETAIL_PAGE_ID = 'order-detail';
export const PAGE_HEADER_WIDGET_TYPE = 'pageHeader';

export const orderWidgetTypes = {
  OrderSummary: 'orderSummary',
  OrderPayments: 'orderPayments',
  OrderInvoice: 'orderInvoice',
  OrderCommissions: 'orderCommissions'
};

export const isOrderWidget = (type) => Object.values(orderWidgetTypes).includes(type);
export const isOrderPage = (page) => page?.id === ORDER_DETAIL_PAGE_ID || page?.type === 'Order';
export const supportsPageHeader = (page) => page?.type !== 'Corporate' && (page?.type === 'Customer' || isOrderPage(page) || ['CSDB', 'PDB', 'customer', 'dashboard', 'orders', 'earnings'].includes(page?.id));
export const widgetTypesForPage = (types, page) => Object.keys(types).filter(key => types[key] === PAGE_HEADER_WIDGET_TYPE ? supportsPageHeader(page) : isOrderPage(page) || !isOrderWidget(types[key]));

export function orderPermissions(scope, customerId, enableEdit = false) {
  const corporate = scope == null || scope === '';
  return {
    canEdit: corporate && Boolean(enableEdit),
    canViewCommissions: corporate,
    canViewPayments: corporate || String(scope).toLowerCase() === String(customerId ?? '').toLowerCase()
  };
}

export function orderTotals(order) {
  const calculated = (order?.lineItems ?? []).reduce((sum, item) => sum + Number(item.price ?? 0) * Number(item.quantity ?? 0), 0);
  const totalPaid = (order?.payments ?? []).reduce((sum, payment) => sum + Number(payment.amount ?? 0), 0);
  return {
    itemsTotal: calculated,
    subTotal: Number(order?.subTotal ?? 0) > 0 ? Number(order.subTotal) : calculated,
    totalPaid,
    invoiceTotal: Number(order?.total ?? 0),
    balanceDue: Number(order?.total ?? 0) - totalPaid
  };
}

// These definitions are also used for the editor's initial preview. Saving the
// default layout creates real widgets through POST and uses the returned IDs.
export const defaultOrderWidgets = [
  { id: 'default-order-summary', name: 'Order Summary', title: '', type: orderWidgetTypes.OrderSummary, state: 0, settings: {} },
  { id: 'default-order-payments', name: 'Order Payments', title: 'Payments', type: orderWidgetTypes.OrderPayments, state: 0, settings: {} },
  { id: 'default-order-invoice', name: 'Order Invoice', title: '', type: orderWidgetTypes.OrderInvoice, state: 0, settings: {} }
];

export function defaultOrderPage(widgetIds = defaultOrderWidgets.map(widget => widget.id)) {
  return {
    id: ORDER_DETAIL_PAGE_ID,
    name: 'Order Details',
    type: 'System',
    description: 'Customer order details',
    children: [
      { id: 'order-sidebar', columns: 4, children: [
        { id: 'order-summary', columns: 12, widgetId: widgetIds[0] },
        { id: 'order-payments', columns: 12, widgetId: widgetIds[1] }
      ] },
      { id: 'order-invoice', columns: 8, widgetId: widgetIds[2] }
    ]
  };
}

export function customPageUrl(page) {
  if (page.type === 'Order') return `/customers/{customerId}/orders/{orderId}/pages/${page.id}`;
  if (page.type === 'Customer') return `/customers/{customerId}/${page.id}`;
  return `/page/${page.id}`;
}

export function orderDetailUrl(customerId, orderId, pageId = ORDER_DETAIL_PAGE_ID) {
  const path = `/customers/${encodeURIComponent(customerId)}/orders/${encodeURIComponent(orderId)}`;
  return !pageId || pageId === ORDER_DETAIL_PAGE_ID ? path : `${path}/pages/${encodeURIComponent(pageId)}`;
}

export function resolvePageUrl(url, customerId, orderId) {
  if (!url) return url;
  if ((url.includes('{orderId}') && !orderId) || (url.includes('{customerId}') && !customerId)) return null;
  return url.replaceAll('{customerId}', encodeURIComponent(customerId ?? '')).replaceAll('{orderId}', encodeURIComponent(orderId ?? ''));
}

export const previewOrderContext = {
  customerId: 'EX456', orderId: 'EX1001', customer: { fullName: 'Example Customer' },
  countries: [{ iso2: 'US', name: 'United States' }],
  order: {
    id: 'EX1001', customerId: 'EX456', externalIds: 'WEB1001', orderDate: '2026-01-15T12:00:00Z', invoiceDate: '2026-01-15T12:00:00Z',
    orderType: 'Standard', status: 'Shipped', tracking: '123456789', notes: 'Example order', currencyCode: 'USD',
    shipTo: 'Example Customer', shipAddress: { line1: '123 Example Street', city: 'Denver', stateCode: 'CO', zip: '80202', countryCode: 'US' },
    subTotal: 100, shipping: 5, discount: 10, tax: 7, total: 102,
    lineItems: [{ productId: 'EX1', description: 'Example Product', quantity: 2, price: 50, volume: [{ volumeId: 'PV', volume: 80 }] }],
    payments: [{ amount: 102, date: '2026-01-15T12:00:00Z', paymentType: 'Credit Card', status: 'Approved', merchant: 'Example Merchant', transactionNumber: 'TX1001' }]
  }
};
