import test from 'node:test';
import assert from 'node:assert/strict';
import { isPageHeaderBackgroundTransparent, pageHeaderBreadcrumbs, pageHeaderBreadcrumbSettings, pageHeaderName } from './pageHeader.mjs';
import { widgetTypesForPage, PAGE_HEADER_WIDGET_TYPE } from './orderPage.mjs';

test('header widgets are available for Customer and Order pages, including their system pages', () => {
  const types = { Html: 'html', PageHeader: PAGE_HEADER_WIDGET_TYPE };
  for (const page of [{ type: 'Customer' }, { type: 'Order' }, { type: 'System', id: 'order-detail' }, { type: 'System', id: 'CSDB' }, { id: 'PDB' }]) {
    assert.ok(widgetTypesForPage(types, page).includes('PageHeader'));
  }
  for (const page of [{ type: 'Corporate' }, { type: 'Corporate', id: 'CSDB' }, { type: 'System', id: 'tree_1' }, undefined]) {
    assert.deepEqual(widgetTypesForPage(types, page), ['Html']);
  }
});

test('page header transparency preserves existing colored headers and honors an explicit setting', () => {
  assert.equal(isPageHeaderBackgroundTransparent({}), true);
  assert.equal(isPageHeaderBackgroundTransparent({ headerColor: '', backgroundColor: null }), true);
  assert.equal(isPageHeaderBackgroundTransparent({ headerColor: 'transparent' }), true);
  assert.equal(isPageHeaderBackgroundTransparent({ headerColor: '#ffffff' }), false);
  assert.equal(isPageHeaderBackgroundTransparent({ backgroundColor: '#123456' }), false);
  assert.equal(isPageHeaderBackgroundTransparent({ headerColor: '#ffffff', backgroundColor: '#123456', settings: { transparentBackground: true } }), true);
  assert.equal(isPageHeaderBackgroundTransparent({ settings: { transparentBackground: false } }), false);
});

test('default breadcrumbs use the actual page name and leave the current page unlinked', () => {
  assert.deepEqual(pageHeaderBreadcrumbs({}, { customerId: 'C1', page: { name: 'Customer Extras' } }), [{ id: 'current-page', label: 'Customer Extras', link: null }]);
  const rows = pageHeaderBreadcrumbs({}, { customerId: 'C1', orderId: 'O1', page: { name: 'Custom Invoice' } });
  assert.deepEqual(rows.map(row => [row.label, row.link]), [['Order History', '/customers/C1/orders'], ['Custom Invoice', null]]);
  assert.equal(pageHeaderName({ id: 'order-detail' }), 'Order Details');
  assert.equal(pageHeaderName({ id: 'constructor' }), 'Current page');
});

test('custom labels and links follow the current customer and order; missing IDs never form broken links', () => {
  const settings = { breadcrumbs: [{ id: 'custom', label: 'Order {orderId}', link: '/customers/{customerId}/orders/{orderId}' }, { id: 'current', label: '{pageName}', link: '' }] };
  const rows = pageHeaderBreadcrumbs(settings, { customerId: 'C 1', orderId: 'O/2', page: { name: 'Invoice' } });
  assert.deepEqual(rows.map(row => [row.label, row.link]), [['Order O/2', '/customers/C%201/orders/O%2F2'], ['Invoice', null]]);
  assert.equal(pageHeaderBreadcrumbs(settings, { customerId: 'C2', orderId: 'O3' })[0].link, '/customers/C2/orders/O3');
  assert.equal(pageHeaderBreadcrumbs(settings, { customerId: 'C1' })[0].link, null);
});

test('breadcrumb visibility and an intentionally empty list are preserved', () => {
  const context = { customerId: 'C1', orderId: 'O1' };
  assert.deepEqual(pageHeaderBreadcrumbs({ showBreadcrumbs: false }, context), []);
  assert.deepEqual(pageHeaderBreadcrumbs({ breadcrumbs: [] }, context), []);
  assert.deepEqual(pageHeaderBreadcrumbs({ breadcrumbs: [null, { label: '  ' }] }, context), []);
  assert.equal(pageHeaderBreadcrumbSettings({}, true).length, 2);
});

test('breadcrumb links accept page URLs while rejecting unsupported schemes and unresolved placeholders', () => {
  const settings = { breadcrumbs: [
    { label: 'Relative', link: '/customers/{customerId}/orders' },
    { label: 'External', link: 'https://example.com/help' },
    { label: 'Script', link: 'javascript:alert(1)' },
    { label: 'Unresolved', link: '/orders/{unknown}' }
  ] };
  assert.deepEqual(pageHeaderBreadcrumbs(settings, { customerId: 'C1' }).map(row => row.link), ['/customers/C1/orders', 'https://example.com/help', null, null]);
});
