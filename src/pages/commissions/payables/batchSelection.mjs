import { filterIncludedBonuses, filterPlanBonuses, normalizeBonusTitle as normalizeBonus } from './bonusScope.mjs';
import { filterIncludedMerchants, getMerchantOptions, merchantIdFor } from './merchantScope.mjs';

export const CLASS_ORDER = ['RELEASE', 'FORFEIT', 'HOLD'];

export const asClass = value => String(value ?? '').toUpperCase();

export const toBonusKey = (earningsClass, periodId, bonusTitle) =>
  `${asClass(earningsClass)}_${String(periodId)}_${normalizeBonus(bonusTitle)}`;

export const defaultClassSelection = () => ({ RELEASE: true, FORFEIT: false, HOLD: false });

export function aggregateSummary(rows = []) {
  const grouped = new Map();
  for (const row of rows) {
    const earningsClass = asClass(row.earningsClass);
    const key = toBonusKey(earningsClass, row.period?.id, row.bonusTitle);
    if (!grouped.has(key)) {
      grouped.set(key, { ...row, earningsClass, key, paidAmount: 0, released: 0, customerPaidCount: 0 });
    }
    const group = grouped.get(key);
    group.paidAmount += row.paidAmount ?? 0;
    group.released += row.released ?? 0;
    group.customerPaidCount += row.customerPaidCount ?? 0;
  }
  return [...grouped.values()].sort((a, b) =>
    CLASS_ORDER.indexOf(a.earningsClass) - CLASS_ORDER.indexOf(b.earningsClass)
    || new Date(a.period?.end) - new Date(b.period?.end));
}

export function summarizePayables(rows = []) {
  const customers = new Map();
  for (const row of rows) {
    const key = toBonusKey(row.earningsClass, row.period?.id, row.bonusTitle);
    if (!customers.has(key)) customers.set(key, new Set());
    customers.get(key).add(String(row.nodeId));
  }
  return aggregateSummary(rows.map(row => ({ ...row, paidAmount: row.amount, customerPaidCount: 0 })))
    .map(row => ({ ...row, customerPaidCount: customers.get(row.key).size }));
}

function buildRecordSelection(records, selectedClasses, customerId, restrictCustomers = false) {
  const groups = new Map();
  const merchantTotals = new Map();
  let total = 0;
  let forfeitTotal = 0;
  let totalCustomers = 0;
  for (const row of records) {
    const sourceClass = asClass(row.sourceEarningsClass ?? row.earningsClass);
    const periodId = String(row.period?.id ?? '').trim();
    const bonusTitle = String(row.bonusTitle ?? '').trim();
    const nodeId = String(row.nodeId ?? '').trim();
    if (!CLASS_ORDER.includes(sourceClass) || !periodId || !bonusTitle || !nodeId) continue;
    const key = toBonusKey(sourceClass, periodId, bonusTitle);
    if (!groups.has(key)) groups.set(key, {
      earningsClass: sourceClass, periodId, bonusTitle, available: new Set(), selected: new Set(),
    });
    const group = groups.get(key);
    group.available.add(nodeId);
    if ((customerId && customerId !== nodeId) || !selectedClasses[asClass(row.earningsClass)]) continue;
    if (!group.selected.has(nodeId)) totalCustomers += 1;
    group.selected.add(nodeId);
    const due = (row.amount ?? 0) - (row.released ?? 0);
    if (sourceClass === 'FORFEIT') forfeitTotal += due;
    else {
      total += due;
      const merchantId = merchantIdFor(row);
      if (!merchantTotals.has(merchantId)) merchantTotals.set(merchantId, { ...getMerchantOptions([row])[0], total: 0 });
      merchantTotals.get(merchantId).total += due;
    }
  }
  return {
    totals: { total, forfeitTotal, totalCustomers },
    merchantTotals: [...merchantTotals.values()].sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id)),
    groups: [...groups.values()].filter(group => group.selected.size).map(({ available, selected, ...group }) => ({
      ...group,
      // Keep the API's original class. Locally held customers must be excluded
      // from shared Release groups even when other customers are selected.
      // Merchant filters also require explicit IDs: an ALL group could include
      // other merchants' customers who share this bonus and period.
      selection: !customerId && !restrictCustomers && selected.size === available.size
        ? { mode: 'ALL' }
        : { mode: 'ONLY', includeNodeIds: [...selected].sort() },
    })),
  };
}

// Main view selects entire sections; customer view includes only the opened
// customer and computes totals from that customer's actual payable records.
export function buildBatchSelection({ cutoffDate, summaryRows, selectedClasses, customerId, customerPayables = [], payableRecords, excludedBonuses = [], excludedMerchantIds = [], compensationPlanId, allowNegativeNetPayments = false }) {
  if (payableRecords !== undefined) {
    const scoped = filterIncludedBonuses(compensationPlanId === undefined ? payableRecords : filterPlanBonuses(payableRecords, compensationPlanId), excludedBonuses);
    const selection = buildRecordSelection(filterIncludedMerchants(scoped, excludedMerchantIds), selectedClasses, String(customerId ?? '').trim(), excludedMerchantIds.length > 0);
    return {
      totals: selection.totals,
      merchantTotals: selection.merchantTotals,
      payload: { cutoffDate, groups: selection.groups, options: {
        allowNegativeNetPayments: !!allowNegativeNetPayments,
        failOnUnknownNodeIds: true,
        failOnUnknownBonusTitles: true,
      } },
    };
  }
  let total = 0;
  let forfeitTotal = 0;
  let totalCustomers = 0;
  const groups = [];
  const selectedCustomerId = String(customerId ?? '').trim();
  const sourceRows = selectedCustomerId ? customerPayables : summaryRows;
  const includedRows = filterIncludedBonuses(compensationPlanId === undefined ? sourceRows : filterPlanBonuses(sourceRows, compensationPlanId), excludedBonuses);
  const rows = selectedCustomerId
    ? aggregateSummary(includedRows
      .filter(row => String(row.nodeId ?? '') === selectedCustomerId)
      .map(row => ({ ...row, paidAmount: row.amount ?? 0, customerPaidCount: 0 })))
      .map(row => ({ ...row, customerPaidCount: 1 }))
    : aggregateSummary(includedRows);

  for (const row of rows) {
    const earningsClass = asClass(row.earningsClass);
    if (!CLASS_ORDER.includes(earningsClass) || !selectedClasses[earningsClass]) continue;
    const periodId = String(row.period?.id ?? '').trim();
    const bonusTitle = String(row.bonusTitle ?? '').trim();
    if (!periodId || !bonusTitle) continue;

    const due = row.paidAmount - row.released;
    if (earningsClass === 'FORFEIT') forfeitTotal += due;
    else total += due;
    totalCustomers += row.customerPaidCount;
    const selection = selectedCustomerId
      ? { mode: 'ONLY', includeNodeIds: [selectedCustomerId] }
      : { mode: 'ALL' };
    groups.push({ earningsClass, periodId, bonusTitle, selection });
  }

  return {
    totals: { total, forfeitTotal, totalCustomers },
    payload: {
      cutoffDate,
      groups,
      options: {
        allowNegativeNetPayments: !!allowNegativeNetPayments,
        failOnUnknownNodeIds: true,
        failOnUnknownBonusTitles: true,
      },
    },
  };
}
