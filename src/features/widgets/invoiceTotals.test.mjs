import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvoiceTotalRows, getInvoiceTotalSettings } from './invoiceTotals.mjs';
import { orderTotals } from './orderPage.mjs';

const order = {
  subTotal: 80, discount: 5, shipping: 6, tax: 7, taxRate: 10, total: 88,
  lineItems: [{ price: '25', quantity: '2' }, { price: 20, quantity: 2 }]
};

test('existing invoices keep their totals and Items Total starts hidden', () => {
  assert.deepEqual(getInvoiceTotalRows(order).map(row => [row.label, row.value]), [
    ['Subtotal', 80], ['Discount', -5], ['Shipping', 6], ['Tax (10 %)', 7]
  ]);
  assert.equal(getInvoiceTotalSettings().find(row => row.id === 'itemsTotal').visible, false);
  assert.deepEqual(getInvoiceTotalRows({}).map(row => row.value), [0, 0, 0]);
});

test('Items Total sums extended line prices independently of the reported subtotal', () => {
  const settings = { invoiceTotals: [{ id: 'itemsTotal', visible: true }] };
  const rows = getInvoiceTotalRows(order, settings);
  assert.equal(rows.find(row => row.id === 'itemsTotal').value, 90);
  assert.equal(rows.find(row => row.id === 'subTotal').value, 80);
  assert.equal(getInvoiceTotalRows({}, settings).find(row => row.id === 'itemsTotal').value, 0);
  assert.equal(orderTotals(order).invoiceTotal, 88);
  assert.equal(getInvoiceTotalRows({ lineItems: [{}, { price: 50, quantity: 0 }] }, settings).find(row => row.id === 'itemsTotal').value, 0);
});

test('labels, visibility, and order are independent of calculation and Invoice Total', () => {
  const settings = { invoiceTotals: [
    { id: 'tax', label: 'VAT', visible: true },
    { id: 'itemsTotal', label: 'Products', visible: true },
    { id: 'shipping', label: 'Delivery', visible: false },
    { id: 'subTotal', label: 'Before discount', visible: true },
    { id: 'discount', label: 'Savings', visible: true }
  ] };
  assert.deepEqual(getInvoiceTotalRows(order, settings).map(row => [row.label, row.value]), [
    ['VAT (10 %)', 7], ['Products', 90], ['Before discount', 80], ['Savings', -5]
  ]);
  const hidden = { invoiceTotals: getInvoiceTotalSettings(settings).map(row => ({ ...row, visible: false })) };
  assert.deepEqual(getInvoiceTotalRows(order, hidden), []);
  assert.equal(orderTotals(order).invoiceTotal, 88);
});

test('imported settings cannot add or reorder Invoice Total; missing settings stay usable', () => {
  const settings = { invoiceTotals: [
    { id: 'invoiceTotal', visible: false }, null,
    { id: 'shipping', label: '  ', visible: true },
    { id: 'shipping', label: 'Duplicate', visible: false },
    { id: 'tax', label: 7, visible: 'false' }
  ] };
  assert.deepEqual(getInvoiceTotalSettings(settings).map(row => row.id), ['shipping', 'tax', 'itemsTotal', 'subTotal', 'discount']);
  assert.equal(getInvoiceTotalRows(order, settings)[0].label, 'Shipping');
  assert.equal(getInvoiceTotalRows(order, settings)[1].label, 'Tax (10 %)');
  assert.equal(getInvoiceTotalSettings({ invoiceTotals: {} }).length, 5);
});
