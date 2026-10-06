export const CLASS_ORDER = ['RELEASE', 'FORFEIT', 'HOLD'];

export const asClass = value => String(value ?? '').toUpperCase();
const normalizeBonus = value => String(value ?? '').trim().toLowerCase();

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

// Main view selects entire sections; customer view includes only the opened
// customer and computes totals from that customer's actual payable records.
export function buildBatchSelection({ cutoffDate, summaryRows, selectedClasses, customerId, customerPayables = [], allowNegativeNetPayments = false }) {
  let total = 0;
  let forfeitTotal = 0;
  let totalCustomers = 0;
  const groups = [];
  const selectedCustomerId = String(customerId ?? '').trim();
  const rows = selectedCustomerId
    ? aggregateSummary(customerPayables
      .filter(row => String(row.nodeId ?? '') === selectedCustomerId)
      .map(row => ({ ...row, paidAmount: row.amount ?? 0, customerPaidCount: 0 })))
      .map(row => ({ ...row, customerPaidCount: 1 }))
    : aggregateSummary(summaryRows);

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
