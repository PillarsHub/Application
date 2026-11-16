import test from 'node:test';
import assert from 'node:assert/strict';
import { orderPermissions, orderTotals, defaultOrderPage, defaultOrderWidgets, customPageUrl, orderDetailUrl, resolvePageUrl, widgetTypesForPage, orderWidgetTypes } from './orderPage.mjs';

test('order access follows the viewer, independent of widget placement', () => {
  assert.deepEqual(orderPermissions(undefined, 'customer', true), { canEdit: true, canViewPayments: true, canViewCommissions: true });
  assert.equal(orderPermissions('', 'customer', false).canEdit, false);
  assert.deepEqual(orderPermissions('CUSTOMER', 'customer', true), { canEdit: false, canViewPayments: true, canViewCommissions: false });
  assert.deepEqual(orderPermissions('sponsor', 'customer', true), { canEdit: false, canViewPayments: false, canViewCommissions: false });
});

test('invoice handles absent items, numeric strings, balance, and credit', () => {
  assert.deepEqual(orderTotals({}), { itemsTotal: 0, subTotal: 0, totalPaid: 0, invoiceTotal: 0, balanceDue: 0 });
  assert.deepEqual(orderTotals({ subTotal: 0, total: '115', lineItems: [{ price: '25', quantity: '4' }], payments: [{ amount: '50' }, { amount: 20 }] }), { itemsTotal: 100, subTotal: 100, totalPaid: 70, invoiceTotal: 115, balanceDue: 45 });
  assert.equal(orderTotals({ subTotal: '80', total: 80, payments: [{ amount: 90 }] }).balanceDue, -10);
  assert.equal(orderTotals({ subTotal: '80', lineItems: [{ price: 25, quantity: 4 }] }).subTotal, 80);
});

test('default layout uses server-generated widget IDs when saved', () => {
  const page = defaultOrderPage(['real-summary', 'real-payments', 'real-invoice']);
  assert.deepEqual(page.children[0].children.map(card => card.widgetId), ['real-summary', 'real-payments']);
  assert.equal(page.children[1].widgetId, 'real-invoice');
  assert.equal(defaultOrderPage().children[1].widgetId, defaultOrderWidgets[2].id);
});

test('order links require both context IDs and escape values', () => {
  const url = customPageUrl({ type: 'Order', id: 'shipping' });
  assert.equal(resolvePageUrl(url, 'cust 1', 'order/2'), '/customers/cust%201/orders/order%2F2/pages/shipping');
  assert.equal(resolvePageUrl(url, 'cust1'), null);
  assert.equal(resolvePageUrl(url, undefined, 'order2'), null);
  assert.equal(resolvePageUrl('/customers/{customerId}/summary', 'cust1'), '/customers/cust1/summary');
  assert.equal(customPageUrl({ type: 'Corporate', id: 'reports' }), '/page/reports');
});

test('order widget choices are available only with order page context', () => {
  const types = { Html: 'html', ...orderWidgetTypes };
  assert.deepEqual(widgetTypesForPage(types, { type: 'Customer' }), ['Html']);
  assert.deepEqual(widgetTypesForPage(types, { type: 'Corporate' }), ['Html']);
  assert.equal(widgetTypesForPage(types, { type: 'Order' }).length, 5);
  assert.equal(widgetTypesForPage(types, defaultOrderPage()).length, 5);
  assert.ok(widgetTypesForPage(types, { type: 'Order' }).includes('OrderCommissions'));
});

test('Orders widgets link to the system or selected custom page with both IDs', () => {
  assert.equal(orderDetailUrl('C1', 'O1'), '/customers/C1/orders/O1');
  assert.equal(orderDetailUrl('C1', 'O1', ''), '/customers/C1/orders/O1');
  assert.equal(orderDetailUrl('C1', 'O1', 'order-detail'), '/customers/C1/orders/O1');
  assert.equal(orderDetailUrl('C1', 'O1', 'custom_invoice'), '/customers/C1/orders/O1/pages/custom_invoice');
  assert.equal(orderDetailUrl('customer 1', 'order/2', 'custom page'), '/customers/customer%201/orders/order%2F2/pages/custom%20page');
});
