import assert from 'node:assert/strict';
import test from 'node:test';
import { applyNegativeHolds, filterIncludedBonuses, filterPlanBonuses } from './bonusScope.mjs';
import { buildBatchSelection, defaultClassSelection, summarizePayables } from './batchSelection.mjs';
import { getCustomerPage, getPeriodDueTotals, groupCustomerPeriods, groupCustomers } from './customerGroups.mjs';

const old = { id: 'old', end: '2026-08-31', compensationPlanId: 1 };
const current = { id: 'current', end: '2026-09-30', compensationPlanId: 1 };
const row = (nodeId, bonusTitle, amount, overrides = {}) => ({
  nodeId, bonusTitle, amount, released: 0, earningsClass: 'RELEASE', period: old,
  customer: { id: nodeId, fullName: nodeId, status: { name: 'Active' } }, ...overrides,
});
const records = [
  row('Alice', 'Retail', -15),
  row('Alice', 'Team', 40, { released: 5, period: current }),
  row('Bob', 'Retail', 60, { released: 10 }),
  row('Bob', 'Retail', 5),
  row('Carol', 'Retail', 10, { earningsClass: 'HOLD' }),
  row('David', 'Retail', -7, { earningsClass: 'FORFEIT' }),
];
const scoped = (excluded = [], source = records, planId = 1) => applyNegativeHolds(filterIncludedBonuses(filterPlanBonuses(source, planId), excluded));
const selection = (payableRecords, selectedClasses = defaultClassSelection(), customerId) => buildBatchSelection({
  cutoffDate: current.end, payableRecords, selectedClasses, customerId,
});
// Independently reproduce the existing API selection contract against the
// original records, rather than trusting the locally displayed classes.
function selectedByApi(original, payload) {
  return original.filter(record => payload.groups.some(group => {
    if (group.earningsClass !== record.earningsClass || group.periodId !== record.period.id
      || group.bonusTitle.toLowerCase() !== record.bonusTitle.toLowerCase()) return false;
    if (group.selection.mode === 'ALL') return true;
    if (group.selection.mode === 'ONLY') return group.selection.includeNodeIds.includes(record.nodeId);
    return !group.selection.excludeNodeIds.includes(record.nodeId);
  }));
}

test('Bonus exclusion moves the entire negative customer to Hold and restoring bonuses moves them back', () => {
  const original = structuredClone(records);
  assert.ok(scoped().filter(record => record.nodeId === 'Alice').every(record => record.earningsClass === 'RELEASE'));
  const held = scoped(['team']);
  const alice = held.find(record => record.nodeId === 'Alice');
  assert.equal(alice.earningsClass, 'HOLD');
  assert.equal(alice.sourceEarningsClass, 'RELEASE');
  assert.equal(alice.customer.status.name, 'Active');
  assert.deepEqual(scoped(), applyNegativeHolds(records));
  assert.deepEqual(records, original);
});

test('Only strictly negative decimal balances are held; exact zero and small positive balances remain Release', () => {
  const amounts = [
    row('zero', 'Retail', 0.3, { released: 0.2 }), row('zero', 'Adjustment', -0.1),
    row('small positive', 'Retail', 0.001), row('small negative', 'Retail', -0.001),
    row('scientific zero', 'Retail', 1e-7), row('scientific zero', 'Adjustment', -1e-7),
  ];
  const result = applyNegativeHolds(amounts);
  assert.deepEqual(result.map(record => record.earningsClass), ['RELEASE', 'RELEASE', 'RELEASE', 'HOLD', 'RELEASE', 'RELEASE']);
});

test('Existing Hold and Forfeit assignments remain unchanged and cannot offset Release balances', () => {
  const result = applyNegativeHolds([
    row('held', 'Retail', 100, { earningsClass: 'HOLD' }),
    row('forfeited', 'Retail', -100, { earningsClass: 'FORFEIT' }),
    row('mixed', 'Retail', -5), row('mixed', 'Forfeited bonus', 1000, { earningsClass: 'FORFEIT' }),
  ]);
  assert.deepEqual(result.map(record => record.earningsClass), ['HOLD', 'FORFEIT', 'HOLD', 'FORFEIT']);
});

test('The selected plan and all included periods determine Hold independently of list filters', () => {
  const source = [...records, row('Alice', 'Retail', 10000, { period: { ...current, id: 'other', compensationPlanId: 2 } })];
  const held = scoped(['team'], source);
  const releaseRows = held.filter(record => record.earningsClass === 'RELEASE');
  assert.deepEqual(groupCustomers(releaseRows, current.id).map(customer => customer.id), ['Bob']);
  const holdRows = held.filter(record => record.earningsClass === 'HOLD');
  const customers = groupCustomers(holdRows, current.id);
  assert.deepEqual(customers.map(customer => [customer.id, customer.due]), [['Alice', -15], ['Carol', 10]]);
  getCustomerPage(customers, { search: 'Alice', periodFilter: 'other', count: 1 });
  assert.deepEqual(groupCustomerPeriods(holdRows, 'Alice', 'HOLD').map(period => [period.period.id, period.runningBalance]), [['old', -15]]);
  assert.deepEqual(selection(held), selection(scoped(['team'])));
});

test('Summary totals and customer counts match the reassigned rows without double-counting bonus details', () => {
  const summary = summarizePayables(scoped(['team']));
  const holdSummary = summary.filter(record => record.earningsClass === 'HOLD');
  assert.deepEqual(getPeriodDueTotals(holdSummary, current.id), { total: -5, selectedPeriod: 0, otherPeriods: -5 });
  const releaseSummary = summary.filter(record => record.earningsClass === 'RELEASE');
  assert.equal(releaseSummary[0].customerPaidCount, 1);
  assert.equal(releaseSummary[0].paidAmount - releaseSummary[0].released, 55);
});

test('Default Release batches exclude locally held customers from shared API Release groups', () => {
  const batch = selection(scoped(['team']));
  assert.deepEqual(batch.payload.groups, [{
    earningsClass: 'RELEASE', periodId: 'old', bonusTitle: 'Retail', selection: { mode: 'ONLY', includeNodeIds: ['Bob'] },
  }]);
  assert.deepEqual(batch.totals, { total: 55, forfeitTotal: 0, totalCustomers: 1 });
  const selected = selectedByApi(records, batch.payload);
  assert.ok(selected.every(record => record.nodeId === 'Bob'));
  assert.equal(selected.reduce((sum, record) => sum + record.amount - record.released, 0), batch.totals.total);
});

test('Selecting Hold explicitly includes locally held records under their original API class', () => {
  const batch = selection(scoped(['team']), { HOLD: true });
  const selected = selectedByApi(records, batch.payload);
  assert.deepEqual(selected.map(record => record.nodeId), ['Alice', 'Carol']);
  assert.equal(batch.totals.total, -5);
  assert.equal(batch.payload.groups.find(group => group.earningsClass === 'RELEASE').selection.mode, 'ONLY');
});

test('Selecting both Release and Hold includes each API record once and still distinguishes forfeitures', () => {
  const batch = selection(scoped(['team']), { RELEASE: true, HOLD: true, FORFEIT: true });
  const selected = selectedByApi(records, batch.payload);
  assert.equal(selected.length, records.length - 1);
  assert.equal(batch.totals.total, 50);
  assert.equal(batch.totals.forfeitTotal, -7);
  assert.ok(batch.payload.groups.every(group => group.selection.mode === 'ALL'));
});

test('Restoring bonuses returns the original Release batch and an empty selection creates no groups', () => {
  const initial = selection(scoped());
  selection(scoped(['team']));
  assert.deepEqual(selection(scoped()), initial);
  assert.ok(initial.payload.groups.filter(group => group.earningsClass === 'RELEASE').every(group => group.selection.mode === 'ALL'));
  assert.deepEqual(selection(scoped(['team']), {}).payload.groups, []);
  assert.deepEqual(selection(scoped(['retail', 'team'])).payload.groups, []);
});

test('Opening a locally held customer keeps them unselected by default and never includes other customers', () => {
  assert.deepEqual(selection(scoped(['team']), defaultClassSelection(), 'Alice').payload.groups, []);
  const heldBatch = selection(scoped(['team']), { HOLD: true }, 'Alice');
  assert.equal(heldBatch.totals.total, -15);
  assert.deepEqual(selectedByApi(records, heldBatch.payload).map(record => record.nodeId), ['Alice']);
  const releaseBatch = selection(scoped(), defaultClassSelection(), 'Alice');
  assert.equal(releaseBatch.totals.total, 20);
  assert.ok(selectedByApi(records, releaseBatch.payload).every(record => record.nodeId === 'Alice'));
});
