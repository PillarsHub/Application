import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizePayments } from './paymentHistorySummary.mjs';

const payment = (status, amount, id = 1, name = 'Primary merchant') => ({
  status, amount, customer: { moneyOutMerchant: id == null ? null : { id, name } },
});

test('single populated status retains the other two statuses with zero totals', () => {
  assert.deepEqual(summarizePayments([
    payment('SUCCESS', 125.25), payment('SUCCESS', 74.75),
  ]), {
    count: 2, merchantCount: 1, total: 200,
    statuses: [
      { status: 'PENDING', count: 0, total: 0, merchants: [] },
      {
        status: 'SUCCESS', count: 2, total: 200,
        merchants: [{ id: '1', name: 'Primary merchant', count: 2, total: 200 }],
      },
      { status: 'FAILURE', count: 0, total: 0, merchants: [] },
    ],
  });
});

test('status and merchant subtotals reconcile, keeping equal merchant names separate by ID', () => {
  const result = summarizePayments([
    payment('FAILURE', 40, 2, 'Same name'),
    payment('SUCCESS', 10, 1, 'Same name'),
    payment('PENDING', 25, 1, 'Same name'),
    payment('SUCCESS', 15, 2, 'Same name'),
  ]);
  assert.equal(result.total, 90);
  assert.equal(result.count, 4);
  assert.equal(result.merchantCount, 2);
  assert.deepEqual(result.statuses.map(group => [group.status, group.count, group.total]), [
    ['PENDING', 1, 25], ['SUCCESS', 2, 25], ['FAILURE', 1, 40],
  ]);
  assert.deepEqual(result.statuses.find(group => group.status === 'SUCCESS').merchants.map(merchant => [merchant.id, merchant.total]), [['1', 10], ['2', 15]]);
  for (const group of result.statuses) {
    assert.equal(group.merchants.reduce((sum, merchant) => sum + merchant.total, 0), group.total);
  }
});

test('handles missing assignments, unnamed merchants, and zero or negative adjustments without dropping payments', () => {
  const result = summarizePayments([
    payment('PENDING', 0.1, null), payment('PENDING', 0.2, null),
    payment('PENDING', -0.1, 0, ''), payment('PENDING', 0, 0, ''),
  ]);
  assert.equal(result.total, 0.2);
  assert.equal(result.merchantCount, 2);
  assert.deepEqual(result.statuses.find(group => group.status === 'PENDING').merchants, [
    { id: '0', name: 'Merchant 0', count: 2, total: -0.1 },
    { id: '', name: 'Unknown merchant', count: 2, total: 0.3 },
  ]);
});

test('empty filtered results retain all three statuses with zero totals', () => {
  assert.deepEqual(summarizePayments([]), {
    count: 0, merchantCount: 0, total: 0,
    statuses: [
      { status: 'PENDING', count: 0, total: 0, merchants: [] },
      { status: 'SUCCESS', count: 0, total: 0, merchants: [] },
      { status: 'FAILURE', count: 0, total: 0, merchants: [] },
    ],
  });
});

test('totals update when the visible subset or a payment status changes', () => {
  const rows = [payment('PENDING', 30), payment('FAILURE', 20, 2, 'Other merchant')];
  const filtered = rows.filter(row => row.customer.moneyOutMerchant.id === 1);
  assert.equal(summarizePayments(filtered).total, 30);
  assert.deepEqual(summarizePayments(filtered).statuses.map(group => [group.status, group.count, group.total]), [
    ['PENDING', 1, 30], ['SUCCESS', 0, 0], ['FAILURE', 0, 0],
  ]);
  rows[0] = { ...rows[0], status: 'SUCCESS' };
  assert.deepEqual(summarizePayments(rows).statuses.map(group => [group.status, group.total]), [['PENDING', 0], ['SUCCESS', 30], ['FAILURE', 20]]);
});

test('unrecognized statuses remain included in totals', () => {
  const result = summarizePayments([payment(null, 10), payment('custom', 20)]);
  assert.equal(result.total, 30);
  assert.deepEqual(result.statuses.map(group => group.status), ['PENDING', 'SUCCESS', 'FAILURE', 'CUSTOM', 'UNKNOWN']);
});
