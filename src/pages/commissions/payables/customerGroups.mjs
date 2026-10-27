import { asClass } from './batchSelection.mjs';

export function getPeriodDueTotals(summaryRows, selectedPeriodId) {
  let selectedPeriod = 0;
  let otherPeriods = 0;
  for (const row of summaryRows) {
    const due = (row.paidAmount ?? 0) - (row.released ?? 0);
    if (row.period?.id != null && selectedPeriodId != null && String(row.period.id) === String(selectedPeriodId)) {
      selectedPeriod += due;
    } else {
      otherPeriods += due;
    }
  }
  return { total: selectedPeriod + otherPeriods, selectedPeriod, otherPeriods };
}

export function groupCustomers(payables = [], selectedPeriodId) {
  const customers = new Map();
  for (const payable of payables) {
    const id = String(payable.nodeId ?? payable.customer?.id ?? '').trim();
    if (!id) continue;
    if (!customers.has(id)) {
      customers.set(id, {
        id, customer: { ...payable.customer, id }, amount: 0, released: 0, due: 0, payableCount: 0,
        selectedPeriodDue: 0, otherPeriodsDue: 0,
      });
    }
    const row = customers.get(id);
    row.amount += payable.amount ?? 0;
    row.released += payable.released ?? 0;
    row.due = row.amount - row.released;
    const due = (payable.amount ?? 0) - (payable.released ?? 0);
    if (payable.period?.id != null && selectedPeriodId != null && String(payable.period.id) === String(selectedPeriodId)) {
      row.selectedPeriodDue += due;
    } else {
      row.otherPeriodsDue += due;
    }
    row.payableCount += 1;
  }
  return [...customers.values()];
}

export function getCustomerPage(customers, { search = '', sort = 'due-asc', sortBy, periodFilter = 'all', offset = 0, count = 25 } = {}) {
  const term = search.trim().toLowerCase();
  const dueKey = periodFilter === 'selected' ? 'selectedPeriodDue' : periodFilter === 'other' ? 'otherPeriodsDue' : 'due';
  const sortKey = ['due', 'selectedPeriodDue', 'otherPeriodsDue'].includes(sortBy) ? sortBy : dueKey;
  const matching = customers.filter(row => (periodFilter === 'all' || row[dueKey] !== 0)
    && (!term || [row.id, row.customer.fullName, row.customer.webAlias].some(value => String(value ?? '').toLowerCase().includes(term))));
  const byName = (a, b) => String(a.customer.fullName ?? a.id).localeCompare(String(b.customer.fullName ?? b.id))
    || a.id.localeCompare(b.id);
  matching.sort((a, b) => {
    if (sort === 'name-asc') return byName(a, b);
    if (sort === 'name-desc') return byName(b, a);
    return (sort === 'due-desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]) || byName(a, b);
  });
  const pageOffset = Math.min(Math.max(0, offset), Math.max(0, (Math.ceil(matching.length / count) - 1) * count));
  return { rows: matching.slice(pageOffset, pageOffset + count), total: matching.length, offset: pageOffset };
}

export function groupCustomerPeriods(payables, customerId, earningsClass) {
  const periods = new Map();
  for (const payable of payables) {
    if (String(payable.nodeId ?? payable.customer?.id ?? '') !== String(customerId)) continue;
    if (asClass(payable.earningsClass) !== asClass(earningsClass)) continue;
    const periodId = payable.period?.id;
    if (periodId == null) continue;
    if (!periods.has(String(periodId))) {
      periods.set(String(periodId), { period: payable.period, bonuses: new Map(), amount: 0, released: 0 });
    }
    const group = periods.get(String(periodId));
    const bonusKey = String(payable.bonusTitle ?? '').trim().toLowerCase();
    if (!group.bonuses.has(bonusKey)) group.bonuses.set(bonusKey, { bonusTitle: payable.bonusTitle, amount: 0, released: 0 });
    const bonus = group.bonuses.get(bonusKey);
    bonus.amount += payable.amount ?? 0;
    bonus.released += payable.released ?? 0;
    group.amount += payable.amount ?? 0;
    group.released += payable.released ?? 0;
  }
  const grouped = [...periods.values()].map(group => ({
    ...group,
    bonuses: [...group.bonuses.values()].sort((a, b) => String(a.bonusTitle ?? '').localeCompare(String(b.bonusTitle ?? ''))),
  })).sort((a, b) => new Date(a.period.end) - new Date(b.period.end));
  let runningBalance = 0;
  for (let index = 0; index < grouped.length; index += 1) {
    runningBalance += grouped[index].amount - grouped[index].released;
    grouped[index].runningBalance = runningBalance;
  }
  return grouped;
}

// Read every API page before displaying aggregated customers. A fixed record
// limit could split a customer's totals or omit customers from the list.
export async function loadUnreleasedPages({ queryPage, pageSize = 1000, isCurrent = () => true }) {
  const rows = [];
  for (let offset = 0; isCurrent(); offset += pageSize) {
    const page = await queryPage({ offset, first: pageSize });
    if (!isCurrent()) return null;
    if (!Array.isArray(page)) throw new Error('Unable to load the complete payable list.');
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
  return null;
}
