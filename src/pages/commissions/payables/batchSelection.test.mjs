import assert from 'node:assert/strict';
import test from 'node:test';
import { aggregateSummary, buildBatchSelection, defaultClassSelection } from './batchSelection.mjs';

const cutoffDate = '2026-10-01T05:59:59Z';
const rows = [
  { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: '1' }, paidAmount: 200, released: 25, customerPaidCount: 12 },
  { earningsClass: 'RELEASE', bonusTitle: 'Team', period: { id: '2' }, paidAmount: 50, released: 10, customerPaidCount: 3 },
  { earningsClass: 'FORFEIT', bonusTitle: 'Retail', period: { id: '1' }, paidAmount: 80, released: 20, customerPaidCount: 5 },
  { earningsClass: 'HOLD', bonusTitle: 'Retail', period: { id: '2' }, paidAmount: 70, released: 5, customerPaidCount: 4 },
];

test('Release is selected by default and includes every period and bonus', () => {
  const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection() });
  assert.deepEqual(batch.totals, { total: 215, forfeitTotal: 0, totalCustomers: 15 });
  assert.equal(batch.payload.groups.length, 2);
  assert.deepEqual(batch.payload.groups.map(group => group.periodId), ['1', '2']);
  assert.ok(batch.payload.groups.every(group => group.selection.mode === 'ALL'));
  assert.equal(batch.payload.cutoffDate, cutoffDate);
});

test('Each class selects its entire section with no customer inclusion or exclusion lists', () => {
  for (const earningsClass of ['RELEASE', 'FORFEIT', 'HOLD']) {
    const selectedClasses = { RELEASE: false, FORFEIT: false, HOLD: false, [earningsClass]: true };
    const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses });
    const expected = rows.filter(row => row.earningsClass === earningsClass);
    assert.equal(batch.payload.groups.length, expected.length);
    assert.equal(batch.totals.totalCustomers, expected.reduce((sum, row) => sum + row.customerPaidCount, 0));
    for (const group of batch.payload.groups) {
      assert.equal(group.earningsClass, earningsClass);
      assert.deepEqual(group.selection, { mode: 'ALL' });
    }
  }
});

test('Combined selection distinguishes forfeited amounts and deselecting all produces an empty batch', () => {
  const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: { RELEASE: true, FORFEIT: true, HOLD: true } });
  assert.deepEqual(batch.totals, { total: 280, forfeitTotal: 60, totalCustomers: 24 });
  assert.equal(batch.payload.groups.length, 4);
  const empty = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: {} });
  assert.deepEqual(empty.totals, { total: 0, forfeitTotal: 0, totalCustomers: 0 });
  assert.deepEqual(empty.payload.groups, []);
});

test('Summary totals and ALL groups remain complete even with partially loaded customer details', () => {
  const selectedClasses = defaultClassSelection();
  const initial = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses });
  const expanded = buildBatchSelection({
    cutoffDate, summaryRows: rows, selectedClasses,
    bonusDetails: { RELEASE_1_retail: { payables: [{ customer: { id: 'one-of-twelve' }, amount: 20 }] } },
  });
  assert.deepEqual(expanded, initial);
});

test('Duplicate summary groups are aggregated without losing amounts or emitting duplicate selections', () => {
  const duplicates = [rows[0], { ...rows[0], earningsClass: 'release', bonusTitle: ' RETAIL ', paidAmount: -10, released: 0, customerPaidCount: 1 }];
  const grouped = aggregateSummary(duplicates);
  assert.equal(grouped.length, 1);
  const batch = buildBatchSelection({ cutoffDate, summaryRows: grouped, selectedClasses: defaultClassSelection() });
  assert.deepEqual(batch.totals, { total: 165, forfeitTotal: 0, totalCustomers: 13 });
  assert.equal(batch.payload.groups.length, 1);
});

test('The below-threshold option stays in the payload sent to batch creation', () => {
  const input = { cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection() };
  assert.equal(buildBatchSelection(input).payload.options.allowNegativeNetPayments, false);
  assert.equal(buildBatchSelection({ ...input, allowNegativeNetPayments: true }).payload.options.allowNegativeNetPayments, true);
});

test('Incomplete and unknown groups cannot create payable selections', () => {
  const summaryRows = [
    { ...rows[0], period: null },
    { ...rows[0], bonusTitle: '' },
    { ...rows[0], earningsClass: 'UNKNOWN' },
  ];
  const batch = buildBatchSelection({ cutoffDate, summaryRows, selectedClasses: { RELEASE: true, UNKNOWN: true } });
  assert.deepEqual(batch.payload.groups, []);
  assert.deepEqual(batch.totals, { total: 0, forfeitTotal: 0, totalCustomers: 0 });
});

const customerPayables = [
  { nodeId: '101', earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: '1' }, amount: 30, released: 5 },
  { nodeId: '101', earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: '1' }, amount: 10, released: 0 },
  { nodeId: '101', earningsClass: 'RELEASE', bonusTitle: 'Team', period: { id: '2' }, amount: 20, released: 10 },
  { nodeId: '101', earningsClass: 'FORFEIT', bonusTitle: 'Retail', period: { id: '1' }, amount: 15, released: 0 },
  { nodeId: '101', earningsClass: 'HOLD', bonusTitle: 'Retail', period: { id: '2' }, amount: 8, released: 0 },
  { nodeId: '202', earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: '1' }, amount: 1000, released: 0 },
];

test('Opening a customer restricts every group and its totals to that customer', () => {
  const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection(), customerId: '101', customerPayables });
  assert.deepEqual(batch.totals, { total: 45, forfeitTotal: 0, totalCustomers: 2 });
  assert.equal(batch.payload.groups.length, 2);
  assert.equal(batch.payload.cutoffDate, cutoffDate);
  for (const group of batch.payload.groups) {
    assert.deepEqual(group.selection, { mode: 'ONLY', includeNodeIds: ['101'] });
  }
});

test('Customer batches respect section choices and never include another customer', () => {
  const selectedClasses = { RELEASE: false, FORFEIT: true, HOLD: true };
  const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses, customerId: '101', customerPayables });
  assert.deepEqual(batch.totals, { total: 8, forfeitTotal: 15, totalCustomers: 2 });
  assert.deepEqual(batch.payload.groups.map(group => group.earningsClass), ['FORFEIT', 'HOLD']);
  assert.ok(batch.payload.groups.every(group => group.selection.mode === 'ONLY' && group.selection.includeNodeIds.length === 1));
  const other = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection(), customerId: '202', customerPayables });
  assert.deepEqual(other.totals, { total: 1000, forfeitTotal: 0, totalCustomers: 1 });
  assert.deepEqual(other.payload.groups[0].selection, { mode: 'ONLY', includeNodeIds: ['202'] });
});

test('A loading or empty customer never falls back to selecting the global summary', () => {
  for (const customerId of ['101', 'missing']) {
    const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection(), customerId });
    assert.deepEqual(batch.payload.groups, []);
    assert.deepEqual(batch.totals, { total: 0, forfeitTotal: 0, totalCustomers: 0 });
  }
});

test('Returning to the main view with defaults restores all Release items', () => {
  const batch = buildBatchSelection({ cutoffDate, summaryRows: rows, selectedClasses: defaultClassSelection(), customerId: null, customerPayables });
  assert.deepEqual(batch.totals, { total: 215, forfeitTotal: 0, totalCustomers: 15 });
  assert.ok(batch.payload.groups.every(group => group.earningsClass === 'RELEASE' && group.selection.mode === 'ALL'));
});
