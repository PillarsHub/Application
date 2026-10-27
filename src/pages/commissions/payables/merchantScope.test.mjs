import assert from 'node:assert/strict';
import test from 'node:test';
import { UNKNOWN_MERCHANT_ID, filterIncludedMerchants, getMerchantOptions, loadPayableMerchants, merchantName } from './merchantScope.mjs';
import { applyNegativeHolds, filterIncludedBonuses, filterPlanBonuses } from './bonusScope.mjs';
import { buildBatchSelection, defaultClassSelection, summarizePayables } from './batchSelection.mjs';
import { getPeriodDueTotals, groupCustomerPeriods, groupCustomers } from './customerGroups.mjs';

const period = { id: '1', end: '2026-09-30', compensationPlanId: 1 };
const row = (nodeId, merchant, amount, overrides = {}) => ({
  nodeId, bonusTitle: 'Retail', earningsClass: 'RELEASE', amount, released: 0, period,
  customer: { id: nodeId, fullName: nodeId, moneyOutMerchant: merchant }, ...overrides,
});
const bank1 = { id: 1, name: 'Bank', serviceType: 'MASS_PAY' };
const bank2 = { id: '2', name: 'Bank', serviceType: 4 };
const travel = { id: 3, name: 'Travel', serviceType: 'TygaPay' };
const records = [
  row('Alice', bank1, -15), row('Alice', bank1, 35, { bonusTitle: 'Team' }),
  row('Bob', bank2, 50), row('Carol', bank1, 10, { earningsClass: 'HOLD' }),
  row('David', travel, -7, { earningsClass: 'FORFEIT' }), row('Emma', null, 12),
];
const scope = (excludedMerchantIds = [], excludedBonuses = []) => applyNegativeHolds(filterIncludedBonuses(filterIncludedMerchants(filterPlanBonuses(records, 1), excludedMerchantIds), excludedBonuses));
const batch = (excludedMerchantIds = [], selectedClasses = defaultClassSelection(), customerId) => buildBatchSelection({
  cutoffDate: period.end, payableRecords: scope(excludedMerchantIds), excludedMerchantIds, selectedClasses, customerId,
});
const selectedByApi = payload => records.filter(record => payload.groups.some(group =>
  group.earningsClass === record.earningsClass && group.periodId === record.period.id && group.bonusTitle === record.bonusTitle
  && (group.selection.mode === 'ALL' || group.selection.includeNodeIds?.includes(record.nodeId))));

test('Merchant options use IDs, distinguish identical names, and include unknown merchants', () => {
  assert.deepEqual(getMerchantOptions(records), [
    { id: '1', name: 'Bank', serviceType: 'MassPay' }, { id: '2', name: 'Bank', serviceType: 'PayQuicker' }, { id: '3', name: 'Travel', serviceType: 'TygaPay' },
    { id: UNKNOWN_MERCHANT_ID, name: 'Unknown merchant', serviceType: null },
  ]);
  assert.equal(merchantName({ id: 5, name: ' ' }), 'Merchant 5');
  assert.equal(merchantName(null), 'Unknown merchant');
});

test('Merchant filtering defaults to all and uses merchant ID rather than merchant name', () => {
  const original = structuredClone(records);
  assert.equal(filterIncludedMerchants(records), records);
  assert.deepEqual(filterIncludedMerchants(records, [1]).map(record => record.nodeId), ['Bob', 'David', 'Emma']);
  assert.deepEqual(filterIncludedMerchants(records, ['2']).map(record => record.nodeId), ['Alice', 'Alice', 'Carol', 'David', 'Emma']);
  assert.deepEqual(filterIncludedMerchants(records, ['1', '2', '3', UNKNOWN_MERCHANT_ID]), []);
  assert.deepEqual(filterIncludedMerchants(records, []), original);
  assert.deepEqual(records, original);
});

test('Unknown merchant records remain visible by default and can be excluded explicitly', () => {
  assert.ok(filterIncludedMerchants(records, ['1', '2', '3']).every(record => record.nodeId === 'Emma'));
  assert.ok(filterIncludedMerchants(records, [UNKNOWN_MERCHANT_ID]).every(record => record.nodeId !== 'Emma'));
  assert.deepEqual(getMerchantOptions([]), []);
});

test('Merchant and bonus filters consistently scope summaries, customer rows, running balances, and local Hold', () => {
  const scoped = scope(['2', '3', UNKNOWN_MERCHANT_ID], ['team']);
  assert.deepEqual(scoped.map(record => [record.nodeId, record.earningsClass]), [['Alice', 'HOLD'], ['Carol', 'HOLD']]);
  assert.deepEqual(getPeriodDueTotals(summarizePayables(scoped), period.id), { total: -5, selectedPeriod: -5, otherPeriods: 0 });
  assert.deepEqual(groupCustomers(scoped, period.id).map(customer => [customer.id, customer.due, customer.customer.moneyOutMerchant.id]), [['Alice', -15, 1], ['Carol', 10, 1]]);
  assert.equal(groupCustomerPeriods(scoped, 'Alice', 'HOLD')[0].runningBalance, -15);
  assert.deepEqual(getMerchantOptions(records).map(merchant => merchant.id), ['1', '2', '3', UNKNOWN_MERCHANT_ID]);
});

test('Merchant-restricted batches cannot use ALL and accidentally pay other merchants in a shared bonus group', () => {
  const result = batch(['2', '3', UNKNOWN_MERCHANT_ID]);
  assert.ok(result.payload.groups.every(group => group.selection.mode === 'ONLY'));
  assert.ok(result.payload.groups.every(group => group.selection.includeNodeIds.length === 1 && group.selection.includeNodeIds[0] === 'Alice'));
  assert.deepEqual(selectedByApi(result.payload).map(record => record.nodeId), ['Alice', 'Alice']);
  assert.equal(result.totals.total, 20);
});

test('The batch builder also filters unscoped input and respects all three section choices', () => {
  const result = buildBatchSelection({
    cutoffDate: period.end, payableRecords: applyNegativeHolds(records), excludedMerchantIds: ['2', UNKNOWN_MERCHANT_ID],
    selectedClasses: { RELEASE: true, HOLD: true, FORFEIT: true },
  });
  assert.deepEqual(selectedByApi(result.payload).map(record => record.nodeId), ['Alice', 'Alice', 'Carol', 'David']);
  assert.equal(result.totals.total, 30);
  assert.equal(result.totals.forfeitTotal, -7);
  assert.deepEqual(batch(['1', '2', '3', UNKNOWN_MERCHANT_ID]).payload.groups, []);
});

test('Merchant exclusions apply to individual customer batches, and restoring all restores the original selection', () => {
  assert.deepEqual(batch(['2'], defaultClassSelection(), 'Bob').payload.groups, []);
  const single = batch(['2'], defaultClassSelection(), 'Alice');
  assert.ok(selectedByApi(single.payload).every(record => record.nodeId === 'Alice'));
  const initial = batch();
  batch(['1']);
  assert.deepEqual(batch([]), initial);
  assert.equal(initial.totals.total, 82);
});

test('Payment breakdown keeps merchant IDs separate and matches the selected payment total', () => {
  const result = batch();
  assert.deepEqual(result.merchantTotals, [
    { id: '1', name: 'Bank', serviceType: 'MassPay', total: 20 },
    { id: '2', name: 'Bank', serviceType: 'PayQuicker', total: 50 },
    { id: UNKNOWN_MERCHANT_ID, name: 'Unknown merchant', serviceType: null, total: 12 },
  ]);
  assert.equal(result.merchantTotals.reduce((sum, merchant) => sum + merchant.total, 0), result.totals.total);
});

test('Merchant payment amounts include selected Hold payouts and exclude forfeitures', () => {
  const result = batch([], { RELEASE: true, HOLD: true, FORFEIT: true });
  assert.equal(result.merchantTotals.find(merchant => merchant.id === '1').total, 30);
  assert.ok(result.merchantTotals.every(merchant => merchant.id !== '3'));
  assert.equal(result.totals.forfeitTotal, -7);
  assert.equal(result.merchantTotals.reduce((sum, merchant) => sum + merchant.total, 0), result.totals.total);
  assert.deepEqual(batch([], { FORFEIT: true }).merchantTotals, []);
});

test('The merchant breakdown follows filters, individual customers, and local negative Hold assignments', () => {
  const filtered = batch(['2', UNKNOWN_MERCHANT_ID]);
  assert.deepEqual(filtered.merchantTotals.map(merchant => [merchant.id, merchant.total]), [['1', 20]]);
  const customer = batch([], defaultClassSelection(), 'Bob');
  assert.deepEqual(customer.merchantTotals.map(merchant => [merchant.id, merchant.total]), [['2', 50]]);
  const held = buildBatchSelection({ payableRecords: scope([], ['team']), selectedClasses: defaultClassSelection() });
  assert.deepEqual(held.merchantTotals.map(merchant => [merchant.id, merchant.total]), [['2', 50], [UNKNOWN_MERCHANT_ID, 12]]);
  assert.deepEqual(batch(['1', '2', '3', UNKNOWN_MERCHANT_ID]).merchantTotals, []);
  assert.deepEqual(batch([], {}).merchantTotals, []);
});

test('Merchant payment totals subtract amounts already released', () => {
  const result = buildBatchSelection({ payableRecords: [row('Alice', bank1, 55, { released: 5 })], selectedClasses: defaultClassSelection() });
  assert.equal(result.merchantTotals[0].total, 50);
  assert.equal(result.merchantTotals[0].total, result.totals.total);
});

test('Merchant details are loaded once per distinct customer and attached without changing source rows', async () => {
  const original = structuredClone(records);
  const requests = [];
  const loaded = await loadPayableMerchants({ rows: records, batchSize: 2, queryCustomers: async ids => {
    requests.push(ids);
    return ids.map(id => ({ id, moneyOutMerchant: records.find(record => record.nodeId === id).customer.moneyOutMerchant }));
  } });
  assert.deepEqual(requests, [['Alice', 'Bob'], ['Carol', 'David'], ['Emma']]);
  assert.deepEqual(loaded, original);
  assert.deepEqual(records, original);
  assert.equal(loaded[0].customer.moneyOutMerchant, loaded[1].customer.moneyOutMerchant);
});

test('A failed or cancelled merchant load cannot publish a partial customer snapshot', async () => {
  await assert.rejects(loadPayableMerchants({ rows: records, batchSize: 1, queryCustomers: async ids => {
    if (ids[0] === 'Bob') throw new Error('Network failure');
    return [{ id: ids[0], moneyOutMerchant: bank1 }];
  } }), /Network failure/);
  await assert.rejects(loadPayableMerchants({ rows: records, queryCustomers: async () => undefined }), /customer merchants/);
  let current = true;
  const loaded = await loadPayableMerchants({ rows: records, isCurrent: () => current, queryCustomers: async () => {
    current = false;
    return [{ id: 'Alice', moneyOutMerchant: bank1 }];
  } });
  assert.equal(loaded, null);
  assert.deepEqual(await loadPayableMerchants({ rows: [], queryCustomers: async () => assert.fail('No customers to query') }), []);
});
