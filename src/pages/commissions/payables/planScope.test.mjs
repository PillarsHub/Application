import assert from 'node:assert/strict';
import test from 'node:test';
import { filterIncludedBonuses, filterPlanBonuses, getBonusOptions } from './bonusScope.mjs';
import { aggregateSummary, buildBatchSelection, defaultClassSelection } from './batchSelection.mjs';
import { getPeriodDueTotals, groupCustomerPeriods, groupCustomers } from './customerGroups.mjs';

const periods = {
  old: { id: 'old', end: '2026-08-31', compensationPlanId: 1 },
  current: { id: 'current', end: '2026-09-30', compensationPlanId: '1' },
  other: { id: 'other', end: '2026-09-30', compensationPlanId: 2 },
};
const records = [
  { nodeId: '1', bonusTitle: 'Retail', earningsClass: 'RELEASE', amount: 25, released: 5, period: periods.old },
  { nodeId: '1', bonusTitle: 'Team', earningsClass: 'RELEASE', amount: 50, released: 10, period: periods.current },
  { nodeId: '1', bonusTitle: 'Retail', earningsClass: 'RELEASE', amount: 100, released: 0, period: periods.other },
  { nodeId: '2', bonusTitle: 'Team', earningsClass: 'HOLD', amount: 15, released: 0, period: periods.old },
  { nodeId: '3', bonusTitle: 'Travel', earningsClass: 'FORFEIT', amount: 8, released: 0, period: periods.other },
  { nodeId: '1', bonusTitle: 'Unknown plan', earningsClass: 'RELEASE', amount: 999, released: 0, period: { id: 'unknown' } },
];
const summaryRows = records.map(row => ({ ...row, paidAmount: row.amount, customerPaidCount: 1 }));

test('Plan scope includes all matching periods and distinguishes matching bonus names and period end dates', () => {
  const original = structuredClone(records);
  assert.deepEqual(filterPlanBonuses(records, '1'), [records[0], records[1], records[3]]);
  assert.deepEqual(filterPlanBonuses(records, 2), [records[2], records[4]]);
  assert.deepEqual(filterPlanBonuses(records, 'unavailable'), []);
  assert.deepEqual(records, original);
});

test('Missing plan metadata cannot fall back to displaying or batching every plan', () => {
  assert.deepEqual(filterPlanBonuses(records, null), []);
  assert.deepEqual(filterPlanBonuses(records), []);
  assert.deepEqual(filterPlanBonuses(undefined, 1), []);
  assert.deepEqual(filterPlanBonuses([{ period: null }, {}], 1), []);
  const batch = buildBatchSelection({ summaryRows, selectedClasses: defaultClassSelection(), compensationPlanId: null });
  assert.deepEqual(batch.payload.groups, []);
});

test('Bonus choices and current/previous/total headers contain only the chosen plan', () => {
  const scoped = aggregateSummary(filterPlanBonuses(summaryRows, 1));
  assert.deepEqual(getBonusOptions(scoped).map(bonus => bonus.title), ['Retail', 'Team']);
  assert.deepEqual(getPeriodDueTotals(scoped, 'current'), { total: 75, selectedPeriod: 40, otherPeriods: 35 });
  const excluded = filterIncludedBonuses(scoped, ['retail']);
  assert.deepEqual(getPeriodDueTotals(excluded, 'current'), { total: 55, selectedPeriod: 40, otherPeriods: 15 });
  assert.deepEqual(getBonusOptions(scoped).map(bonus => bonus.title), ['Retail', 'Team']);
});

test('Section customers and expanded running balances exclude other plans while retaining older matching periods', () => {
  const scoped = filterPlanBonuses(records, '1');
  const customers = groupCustomers(scoped, 'current');
  assert.deepEqual(customers.map(row => [row.id, row.selectedPeriodDue, row.otherPeriodsDue, row.due]), [
    ['1', 40, 20, 60], ['2', 0, 15, 15],
  ]);
  const details = groupCustomerPeriods(scoped, '1', 'RELEASE');
  assert.deepEqual(details.map(row => [row.period.id, row.runningBalance]), [['old', 20], ['current', 60]]);
});

test('Whole-section batches enforce the plan even when provided unfiltered summary data', () => {
  const batch = buildBatchSelection({
    cutoffDate: periods.current.end, summaryRows, compensationPlanId: 1,
    selectedClasses: { RELEASE: true, HOLD: true, FORFEIT: true },
  });
  assert.equal(batch.totals.total, 75);
  assert.equal(batch.totals.forfeitTotal, 0);
  assert.equal(batch.payload.groups.length, 3);
  assert.ok(batch.payload.groups.every(group => ['old', 'current'].includes(group.periodId) && group.selection.mode === 'ALL'));
});

test('Customer batches combine plan and bonus filters without including another customer', () => {
  const batch = buildBatchSelection({
    cutoffDate: periods.current.end, summaryRows, compensationPlanId: '1',
    customerId: '1', customerPayables: records, excludedBonuses: ['retail'], selectedClasses: defaultClassSelection(),
  });
  assert.equal(batch.totals.total, 40);
  assert.deepEqual(batch.payload.groups, [{
    earningsClass: 'RELEASE', periodId: 'current', bonusTitle: 'Team', selection: { mode: 'ONLY', includeNodeIds: ['1'] },
  }]);
});

test('Switching plans with the same cutoff date replaces the eligible batch groups and totals', () => {
  const input = { cutoffDate: periods.current.end, summaryRows, selectedClasses: defaultClassSelection() };
  const first = buildBatchSelection({ ...input, compensationPlanId: 1 });
  const second = buildBatchSelection({ ...input, compensationPlanId: 2 });
  assert.equal(first.totals.total, 60);
  assert.equal(second.totals.total, 100);
  assert.deepEqual(second.payload.groups.map(group => group.periodId), ['other']);
  assert.deepEqual(buildBatchSelection({ ...input, compensationPlanId: 1 }), first);
});
