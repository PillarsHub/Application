import assert from 'node:assert/strict';
import test from 'node:test';
import { filterIncludedBonuses, getBonusOptions } from './bonusScope.mjs';
import { buildBatchSelection, defaultClassSelection } from './batchSelection.mjs';
import { getPeriodDueTotals, groupCustomerPeriods, groupCustomers } from './customerGroups.mjs';

const records = [
  { nodeId: '1', bonusTitle: 'Retail', earningsClass: 'RELEASE', amount: 25, released: 5, period: { id: 'old', end: '2026-08-31' } },
  { nodeId: '1', bonusTitle: 'Team', earningsClass: 'RELEASE', amount: 50, released: 10, period: { id: 'new', end: '2026-09-30' } },
  { nodeId: '2', bonusTitle: ' RETAIL ', earningsClass: 'HOLD', amount: 10, released: 2, period: { id: 'new', end: '2026-09-30' } },
  { nodeId: '3', bonusTitle: 'retail', earningsClass: 'FORFEIT', amount: 7, released: 0, period: { id: 'old', end: '2026-08-31' } },
  { nodeId: '4', bonusTitle: 'Team', earningsClass: 'HOLD', amount: 15, released: 0, period: { id: 'old', end: '2026-08-31' } },
];
const summaryRows = records.map(row => ({ ...row, paidAmount: row.amount, customerPaidCount: 1 }));

test('Bonus choices combine sections and periods, normalize names, and stay available after exclusion', () => {
  const bonuses = getBonusOptions(summaryRows);
  assert.deepEqual(bonuses, [{ key: 'retail', title: 'Retail' }, { key: 'team', title: 'Team' }]);
  filterIncludedBonuses(summaryRows, ['retail']);
  assert.deepEqual(getBonusOptions(summaryRows), bonuses);
  assert.deepEqual(getBonusOptions([{ bonusTitle: null }, { bonusTitle: '' }]), []);
});

test('All bonuses are included by default and exclusions preserve source data and new bonus types', () => {
  const original = structuredClone(records);
  assert.deepEqual(filterIncludedBonuses(records), records);
  assert.deepEqual(filterIncludedBonuses(records, [' RETAIL ']).map(row => row.bonusTitle), ['Team', 'Team']);
  assert.deepEqual(filterIncludedBonuses(records, ['retail', 'team']), []);
  assert.deepEqual(filterIncludedBonuses(records, []), original);
  assert.equal(filterIncludedBonuses([...records, { bonusTitle: 'New Bonus' }], ['retail']).at(-1).bonusTitle, 'New Bonus');
  assert.deepEqual(records, original);
});

test('Excluding a bonus removes it from all three batch classes without making partial customer selections', () => {
  const input = { summaryRows, selectedClasses: { RELEASE: true, HOLD: true, FORFEIT: true } };
  const scoped = buildBatchSelection({ ...input, excludedBonuses: ['retail'] });
  assert.deepEqual(scoped.totals, { total: 55, forfeitTotal: 0, totalCustomers: 2 });
  assert.ok(scoped.payload.groups.every(group => group.bonusTitle === 'Team' && group.selection.mode === 'ALL'));
  const empty = buildBatchSelection({ ...input, excludedBonuses: ['retail', 'team'] });
  assert.deepEqual(empty.payload.groups, []);
  assert.deepEqual(empty.totals, { total: 0, forfeitTotal: 0, totalCustomers: 0 });
  assert.deepEqual(buildBatchSelection({ ...input, excludedBonuses: [] }), buildBatchSelection(input));
});

test('Customer-specific batches also exclude bonuses and never include another customer', () => {
  const scoped = buildBatchSelection({
    summaryRows, selectedClasses: defaultClassSelection(), customerId: '1', customerPayables: records, excludedBonuses: ['retail'],
  });
  assert.deepEqual(scoped.totals, { total: 40, forfeitTotal: 0, totalCustomers: 1 });
  assert.equal(scoped.payload.groups.length, 1);
  assert.equal(scoped.payload.groups[0].bonusTitle, 'Team');
  assert.deepEqual(scoped.payload.groups[0].selection, { mode: 'ONLY', includeNodeIds: ['1'] });
});

test('Customer lists, period details, running balances, and headers use the same included bonus scope', () => {
  const includedRecords = filterIncludedBonuses(records, ['retail']);
  const includedSummary = filterIncludedBonuses(summaryRows, ['retail']);
  const customers = groupCustomers(includedRecords, 'new');
  assert.deepEqual(customers.map(row => [row.id, row.due]), [['1', 40], ['4', 15]]);
  const periods = groupCustomerPeriods(includedRecords, '1', 'RELEASE');
  assert.deepEqual(periods.map(row => [row.period.id, row.runningBalance]), [['new', 40]]);
  assert.deepEqual(getPeriodDueTotals(includedSummary, 'new'), { total: 55, selectedPeriod: 40, otherPeriods: 15 });
  assert.equal(buildBatchSelection({ summaryRows: includedSummary, selectedClasses: { RELEASE: true, HOLD: true } }).totals.total, 55);
});
