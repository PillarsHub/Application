import assert from 'node:assert/strict';
import test from 'node:test';
import { getCustomerPage, getPeriodDueTotals, groupCustomerPeriods, groupCustomers, loadUnreleasedPages } from './customerGroups.mjs';
import { buildBatchSelection, defaultClassSelection } from './batchSelection.mjs';

const payable = (id, amount, name = `Customer ${id}`, extras = {}) => ({
  nodeId: id, amount, released: 0, customer: { id, fullName: name }, ...extras,
});

test('Period breakdown subtracts released amounts and matches IDs rather than identical period end dates', () => {
  const summaryRows = [
    { period: { id: 12, end: '2026-09-30T23:59:59Z' }, paidAmount: 100, released: 20 },
    { period: { id: '12', end: '2026-09-30T23:59:59Z' }, paidAmount: 50, released: 10 },
    { period: { id: 34, end: '2026-09-30T23:59:59Z' }, paidAmount: 70, released: 5 },
    { period: { id: 11, end: '2026-08-31T23:59:59Z' }, paidAmount: 30, released: 0 },
  ];
  assert.deepEqual(getPeriodDueTotals(summaryRows, '12'), { total: 215, selectedPeriod: 120, otherPeriods: 95 });
  assert.deepEqual(getPeriodDueTotals(summaryRows, '34'), { total: 215, selectedPeriod: 65, otherPeriods: 150 });
});

test('Period breakdown handles no matches, empty sections, and negative adjustments', () => {
  const summaryRows = [
    { period: { id: 'current' }, paidAmount: -10, released: 0 },
    { period: { id: 'old' }, paidAmount: 50, released: 60 },
    { period: null, paidAmount: 5 },
  ];
  assert.deepEqual(getPeriodDueTotals(summaryRows, 'current'), { total: -15, selectedPeriod: -10, otherPeriods: -5 });
  assert.deepEqual(getPeriodDueTotals(summaryRows, 'missing'), { total: -15, selectedPeriod: 0, otherPeriods: -15 });
  assert.deepEqual(getPeriodDueTotals([], 'current'), { total: 0, selectedPeriod: 0, otherPeriods: 0 });
});

test('Computing the header period breakdown preserves full-section batch totals and selections', () => {
  const summaryRows = [
    { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'current' }, paidAmount: 100, released: 20, customerPaidCount: 2 },
    { earningsClass: 'RELEASE', bonusTitle: 'Team', period: { id: 'old' }, paidAmount: 50, released: 0, customerPaidCount: 1 },
  ];
  const input = { summaryRows, selectedClasses: defaultClassSelection() };
  const before = buildBatchSelection(input);
  const breakdown = getPeriodDueTotals(summaryRows, 'current');
  assert.equal(breakdown.total, before.totals.total);
  assert.equal(breakdown.selectedPeriod + breakdown.otherPeriods, breakdown.total);
  assert.deepEqual(buildBatchSelection(input), before);
  assert.ok(before.payload.groups.every(group => group.selection.mode === 'ALL'));
});

test('Customer totals combine records across periods and bonuses without merging different customers', () => {
  const customers = groupCustomers([
    payable('1', 25, 'Alex', { released: 5 }),
    payable('1', 40, 'Alex', { released: 10 }),
    payable('2', -3, 'Blair'),
    { amount: 100 },
  ]);
  assert.equal(customers.length, 2);
  assert.deepEqual(customers[0], { id: '1', customer: { id: '1', fullName: 'Alex' }, amount: 65, released: 15, due: 50, payableCount: 2, selectedPeriodDue: 0, otherPeriodsDue: 50 });
  assert.equal(customers[1].due, -3);
});

test('Customer period totals match period IDs and include adjustments and released amounts', () => {
  const customers = groupCustomers([
    payable('1', 80, 'Alex', { released: 10, period: { id: 12, end: '2026-09-30' } }),
    payable('1', -5, 'Alex', { period: { id: '12' } }),
    payable('1', 40, 'Alex', { released: 5, period: { id: 34, end: '2026-09-30' } }),
    payable('2', 20, 'Blair', { period: { id: 'old' } }),
  ], '12');
  assert.deepEqual(customers.map(row => [row.id, row.due, row.selectedPeriodDue, row.otherPeriodsDue]), [
    ['1', 100, 65, 35], ['2', 20, 0, 20],
  ]);
  assert.ok(customers.every(row => row.due === row.selectedPeriodDue + row.otherPeriodsDue));
});

test('Period filters include mixed customers and sort on the active period amount', () => {
  const customers = groupCustomers([
    payable('1', 30, 'Alex', { period: { id: 'current' } }),
    payable('1', 200, 'Alex', { period: { id: 'old' } }),
    payable('2', 50, 'Blair', { period: { id: 'current' } }),
    payable('3', -10, 'Casey', { period: { id: 'old' } }),
    payable('4', -5, 'Dee', { period: { id: 'current' } }),
    payable('4', 5, 'Dee', { period: { id: 'old' } }),
  ], 'current');
  assert.deepEqual(getCustomerPage(customers, { periodFilter: 'selected', sort: 'due-desc' }).rows.map(row => row.id), ['2', '1', '4']);
  assert.deepEqual(getCustomerPage(customers, { periodFilter: 'other', sort: 'due-desc' }).rows.map(row => row.id), ['1', '4', '3']);
  assert.deepEqual(getCustomerPage(customers, { periodFilter: 'selected', search: 'AL', sort: 'name-asc' }).rows.map(row => row.id), ['1']);
  assert.equal(getCustomerPage(customers, { periodFilter: 'selected', search: 'Casey' }).total, 0);
  assert.equal(getCustomerPage(customers).total, 4);
});

test('Column sorting uses the clicked amount while retaining the active period filter and full customer totals', () => {
  const customers = groupCustomers([
    payable('1', 30, 'Alex', { period: { id: 'current' } }),
    payable('1', 200, 'Alex', { period: { id: 'old' } }),
    payable('2', 50, 'Blair', { period: { id: 'current' } }),
    payable('3', 1000, 'Casey', { period: { id: 'old' } }),
  ], 'current');
  const options = { periodFilter: 'selected', sort: 'due-desc' };
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'selectedPeriodDue' }).rows.map(row => row.id), ['2', '1']);
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'otherPeriodsDue' }).rows.map(row => row.id), ['1', '2']);
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'due' }).rows.map(row => row.id), ['1', '2']);
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'due', sort: 'due-asc' }).rows.map(row => row.id), ['2', '1']);
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'name', sort: 'name-asc' }).rows.map(row => row.id), ['1', '2']);
  assert.deepEqual(getCustomerPage(customers, { ...options, sortBy: 'name', sort: 'name-desc' }).rows.map(row => row.id), ['2', '1']);
  assert.deepEqual(customers.map(row => [row.id, row.due]), [['1', 230], ['2', 50], ['3', 1000]]);
});

test('Period filtering happens before pagination and leaves full-section batch selection unchanged', () => {
  const records = Array.from({ length: 150 }, (_, index) => payable(String(index), 10, `Customer ${index}`, {
    period: { id: index % 2 ? 'old' : 'current' },
  }));
  const customers = groupCustomers(records, 'current');
  const summaryRows = [
    { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'current' }, paidAmount: 750, customerPaidCount: 75 },
    { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'old' }, paidAmount: 750, customerPaidCount: 75 },
  ];
  const input = { summaryRows, selectedClasses: defaultClassSelection() };
  const batch = buildBatchSelection(input);
  const page = getCustomerPage(customers, { periodFilter: 'selected', offset: 25 });
  assert.equal(page.total, 75);
  assert.equal(page.rows.length, 25);
  assert.ok(page.rows.every(row => row.selectedPeriodDue === 10 && row.otherPeriodsDue === 0));
  assert.deepEqual(buildBatchSelection(input), batch);
  assert.ok(batch.payload.groups.every(group => group.selection.mode === 'ALL'));
});

test('Hundreds of customers are paginated after aggregation and sorted by amount due', () => {
  const customers = groupCustomers(Array.from({ length: 225 }, (_, index) => payable(String(index), 224 - index)));
  const first = getCustomerPage(customers);
  const second = getCustomerPage(customers, { offset: 25 });
  assert.equal(first.total, 225);
  assert.equal(first.rows.length, 25);
  assert.equal(first.rows[0].id, '224');
  assert.equal(second.rows[0].id, '199');
  assert.equal(getCustomerPage(customers, { count: 50 }).rows.length, 50);
  assert.equal(getCustomerPage(customers, { count: 100 }).rows.length, 100);
  assert.equal(getCustomerPage(customers, { offset: 999 }).offset, 200);
});

test('Name and ID searches and name sorting affect only the displayed customers', () => {
  const customers = groupCustomers([payable('12', 20, 'Zoe'), payable('34', 10, 'Alex'), payable('56', 30, 'alexander')]);
  assert.deepEqual(getCustomerPage(customers, { search: 'ALEX', sort: 'name-asc' }).rows.map(row => row.id), ['34', '56']);
  assert.deepEqual(getCustomerPage(customers, { search: '12' }).rows.map(row => row.id), ['12']);
  assert.equal(getCustomerPage(customers, { search: 'missing' }).total, 0);
  assert.equal(getCustomerPage(customers, { sort: 'due-desc' }).rows[0].id, '56');
  assert.equal(getCustomerPage(customers, { sort: 'name-desc' }).rows[0].id, '12');
  assert.equal(customers.length, 3);
  assert.equal(customers.reduce((total, row) => total + row.due, 0), 60);
});

test('Expanding a customer shows only that section and customer, with oldest periods first', () => {
  const rows = [
    payable('1', 20, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'old', end: '2026-08-31T23:59:59Z' } }),
    payable('1', 30, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Team', period: { id: 'new', end: '2026-09-30T23:59:59Z' }, released: 5 }),
    payable('1', 10, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'team', period: { id: 'new', end: '2026-09-30T23:59:59Z' } }),
    payable('1', 100, 'Alex', { earningsClass: 'HOLD', bonusTitle: 'Retail', period: { id: 'new', end: '2026-09-30T23:59:59Z' } }),
    payable('2', 200, 'Blair', { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'new', end: '2026-09-30T23:59:59Z' } }),
  ];
  const periods = groupCustomerPeriods(rows, '1', 'RELEASE');
  assert.deepEqual(periods.map(group => group.period.id), ['old', 'new']);
  assert.equal(periods[1].bonuses.length, 1);
  assert.equal(periods[1].amount - periods[1].released, 35);
  assert.equal(periods[0].amount, 20);
  assert.deepEqual(periods.map(group => group.runningBalance), [20, 55]);
});

test('Period running balances accumulate from oldest to newest using earned minus released', () => {
  const rows = [
    payable('1', 100, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Retail', released: 20, period: { id: 'new', end: '2026-09-30' } }),
    payable('1', 50, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Team', released: 10, period: { id: 'old', end: '2026-07-31' } }),
    payable('1', -15, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Adjustment', period: { id: 'middle', end: '2026-08-31' } }),
    payable('1', 5, 'Alex', { earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: 'old', end: '2026-07-31' } }),
    payable('1', 999, 'Alex', { earningsClass: 'HOLD', period: { id: 'new', end: '2026-09-30' } }),
    payable('2', 999, 'Blair', { earningsClass: 'RELEASE', period: { id: 'new', end: '2026-09-30' } }),
  ];
  const original = structuredClone(rows);
  const periods = groupCustomerPeriods(rows, '1', 'RELEASE');
  assert.deepEqual(periods.map(group => [group.period.id, group.amount - group.released, group.runningBalance]), [
    ['old', 45, 45], ['middle', -15, 30], ['new', 80, 110],
  ]);
  assert.equal(periods.at(-1).runningBalance, periods.reduce((sum, group) => sum + group.amount - group.released, 0));
  assert.deepEqual(rows, original);
});

test('Period running balances handle empty results and a single over-released period', () => {
  assert.deepEqual(groupCustomerPeriods([], '1', 'RELEASE'), []);
  const periods = groupCustomerPeriods([
    payable('1', 10, 'Alex', { earningsClass: 'RELEASE', released: 15, period: { id: 'only', end: '2026-09-30' } }),
  ], '1', 'RELEASE');
  assert.equal(periods[0].runningBalance, -5);
});

test('All API pages are read before aggregating customers who span page boundaries', async () => {
  const records = [payable('1', 10), payable('2', 20), payable('1', 30), payable('3', 40), payable('2', 50)];
  const requests = [];
  const rows = await loadUnreleasedPages({ pageSize: 2, queryPage: async ({ offset, first }) => {
    requests.push(offset);
    return records.slice(offset, offset + first);
  } });
  assert.deepEqual(requests, [0, 2, 4]);
  assert.equal(rows.length, 5);
  assert.equal(groupCustomers(rows).find(row => row.id === '1').due, 40);
  assert.equal(groupCustomers(rows).find(row => row.id === '2').due, 70);
});

test('Exact-size final pages are followed by an empty page, and failed loads do not return partial totals', async () => {
  const requests = [];
  const rows = await loadUnreleasedPages({ pageSize: 2, queryPage: async ({ offset }) => {
    requests.push(offset);
    return offset === 0 ? [payable('1', 1), payable('2', 2)] : [];
  } });
  assert.deepEqual(requests, [0, 2]);
  assert.equal(rows.length, 2);
  await assert.rejects(loadUnreleasedPages({ pageSize: 1, queryPage: async ({ offset }) => {
    if (offset) throw new Error('Network failure');
    return [payable('1', 1)];
  } }), /Network failure/);
  await assert.rejects(loadUnreleasedPages({ queryPage: async () => undefined }), /complete payable list/);
});

test('Cancelled requests cannot publish customer rows for a previous period', async () => {
  let current = true;
  const rows = await loadUnreleasedPages({ isCurrent: () => current, queryPage: async () => {
    current = false;
    return [payable('1', 10)];
  } });
  assert.equal(rows, null);
});

test('Customer list search and pagination do not limit section batch selections', () => {
  const customers = groupCustomers(Array.from({ length: 200 }, (_, index) => payable(String(index), 10)));
  const summaryRows = [{ earningsClass: 'RELEASE', bonusTitle: 'Retail', period: { id: '1' }, paidAmount: 2000, released: 0, customerPaidCount: 200 }];
  const input = { cutoffDate: '2026-09-30T23:59:59Z', summaryRows, selectedClasses: defaultClassSelection() };
  const initial = buildBatchSelection(input);
  getCustomerPage(customers, { search: 'Customer 199', offset: 25 });
  assert.deepEqual(buildBatchSelection(input), initial);
  assert.equal(initial.totals.totalCustomers, 200);
  assert.deepEqual(initial.payload.groups[0].selection, { mode: 'ALL' });
});
